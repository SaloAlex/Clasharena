type Regional = 'americas' | 'europe' | 'asia' | 'sea';

const PLATFORM_TO_REGION: Record<string, Regional> = {
  BR1: 'americas', LA1: 'americas', LA2: 'americas', NA1: 'americas', OC1: 'sea',
  KR: 'asia', JP1: 'asia',
  EUN1: 'europe', EUW1: 'europe', TR1: 'europe', RU: 'europe',
  PH2: 'sea', SG2: 'sea', TH2: 'sea', TW2: 'sea', VN2: 'sea',
};

export const toRegionalFromPlatform = (platform?: string | null): Regional =>
  PLATFORM_TO_REGION[(platform ?? '').toUpperCase()] ?? 'americas';

export const platformHost = (platform?: string | null) =>
  (platform ?? process.env.RIOT_PLATFORM ?? 'LA2').toLowerCase();

export const regionalHost = (region?: string | null) =>
  (region ?? process.env.RIOT_REGION ?? 'americas').toLowerCase();

// Rate Limiter para Riot API
class RiotAPIRateLimiter {
  private requests: number[] = [];
  private maxRequests = 100;
  private timeWindow = 120000; // 2 minutos

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Limpiar requests viejos
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForSlot(); // Recursivo
    }
    
    this.requests.push(now);
  }
}

const rateLimiter = new RiotAPIRateLimiter();

// Importar el nuevo sistema de Data Dragon
import { getValidDataDragonVersion, getChampionImageUrl, getSpellImageUrl, getItemImageUrl } from './data-dragon';

// Mantener compatibilidad con código existente
async function getLatestVersion() {
  return await getValidDataDragonVersion();
}

// Validación de PUUID
function isValidPuuid(puuid: string): boolean {
  // PUUID format: 78 caracteres alfanuméricos con guiones
  const puuidRegex = /^[a-zA-Z0-9_-]{78}$/;
  return puuidRegex.test(puuid);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url: string, opts: RequestInit = {}, max = 3): Promise<Response> {
  let last: any;
  for (let i = 0; i <= max; i++) {
    try {
      // Esperar slot en rate limiter
      await rateLimiter.waitForSlot();
      
      const res = await fetch(url, {
        ...opts,
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY!, ...(opts.headers || {}) }
      });
      if (res.status === 429) { 
        const ra = res.headers.get('Retry-After'); 
        await sleep((ra ? +ra : 2 ** i) * 1000); 
        continue; 
      }
      if (res.status >= 500) { 
        await sleep(2 ** i * 1000); 
        continue; 
      }
      return res;
    } catch (e) { 
      last = e; 
      await sleep(2 ** i * 1000); 
    }
  }
  throw last || new Error('Max retries exceeded');
}

// Fallback más inteligente para summoner-v4
export async function getSummonerIdWithFallback(
  puuid: string, 
  region: string = 'americas', 
  platformId: string = 'la2'
): Promise<string> {
  try {
    // 1. Intento principal con summoner-v4 by-puuid
    const summonerResponse = await fetch(
      `https://${platformId}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
      }
    );

    if (summonerResponse.ok) {
      const data = await summonerResponse.json();
      if (data.id) {
        return data.id;
      }
    }

    // Summoner-v4 no devolvió id, intentando account-v1

    // 2. Fallback: account-v1 para obtener info de la cuenta
    const accountResponse = await fetch(
      `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
      }
    );

    if (!accountResponse.ok) {
      throw new Error(`Account API falló: ${accountResponse.status}`);
    }

    const accountData = await accountResponse.json();
    
    // 3. MEJORA: Usar account data para crear un nuevo summoner
    // En lugar de by-name, usar la combinación correcta
    const riotIdResponse = await fetch(
      `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${accountData.gameName}/${accountData.tagLine}`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
      }
    );

    if (riotIdResponse.ok) {
      const riotIdData = await riotIdResponse.json();
      // Intentar de nuevo con el puuid confirmado
      const finalSummonerResponse = await fetch(
        `https://${platformId}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${riotIdData.puuid}`,
        {
          headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
        }
      );
      
      if (finalSummonerResponse.ok) {
        const finalData = await finalSummonerResponse.json();
                 if (finalData.id) {
           return finalData.id;
         }
      }
    }

    throw new Error(`No se pudo obtener summonerId para puuid: ${puuid}`);
    
  } catch (error) {
    console.error(`[getSummonerIdWithFallback] Error completo:`, error);
    throw new Error(`No se pudo obtener summonerId: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getChampionMasteryBySummonerId(summonerId: string, platform: string) {
  const host = platformHost(platform);
  const url = `https://${host}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}`;
  
  const res = await fetchWithRetry(url);
  
  if (!res.ok) {
    if (res.status === 404) {
      return [];
    }
    throw new Error(`Riot error ${res.status}`);
  }
  
  const data = await res.json();
  return data;
}

export async function getRecentMatchIds(puuid: string, region: string, count = 10) {
  const host = regionalHost(region);
  const url = `https://${host}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Riot error ${res.status}`);
  return res.json() as Promise<string[]>;
}

export async function getMatchDetails(matchId: string, region: string) {
  const host = regionalHost(region);
  const url = `https://${host}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Riot error ${res.status}`);
  return res.json();
}

// Mantener compatibilidad con código existente
export function isValidPlatform(p?: string | null) {
  return !!p && !!PLATFORM_TO_REGION[(p as string).toUpperCase()];
}

export interface Summoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

// Función de debugging para verificar datos del summoner
export async function debugSummonerData(puuid: string) {
  console.log(`[DEBUG] Verificando datos para PUUID: ${puuid}`);
  
  // A) Verificar que el PUUID funciona con Match API (que sabemos que funciona)
  try {
    const matchesResponse = await fetch(
      `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=1`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
      }
    );
    
    console.log(`[DEBUG] Match API status: ${matchesResponse.status}`);
    if (matchesResponse.ok) {
      const matches = await matchesResponse.json();
      console.log(`[DEBUG] ✅ Match API funciona - encontrados ${matches.length} matches`);
    } else {
      console.log(`[DEBUG] ❌ Match API falló - este PUUID puede ser inválido`);
      return false;
    }
  } catch (error) {
    console.log(`[DEBUG] ❌ Error en Match API:`, error);
    return false;
  }

  // B) Verificar summoner-v4 por regiones/plataformas
  const testCombinations = [
    { region: 'americas', platform: 'la1' }, // LAS
    { region: 'americas', platform: 'la2' }, // LAN
    { region: 'americas', platform: 'na1' }, // NA
    { region: 'americas', platform: 'br1' }, // BR
  ];

  for (const { region, platform } of testCombinations) {
    try {
      console.log(`[DEBUG] Probando ${region}/${platform}...`);
      
      const summonerResponse = await fetch(
        `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        {
          headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
        }
      );

      console.log(`[DEBUG] Summoner ${platform} status: ${summonerResponse.status}`);
      
      if (summonerResponse.ok) {
        const summonerData = await summonerResponse.json();
        console.log(`[DEBUG] ✅ Summoner encontrado en ${platform}:`, {
          id: summonerData.id,
          name: summonerData.name,
          level: summonerData.summonerLevel,
          accountId: summonerData.accountId
        });
        
        // MOSTRAR LA RESPUESTA COMPLETA para debugging
        console.log(`[DEBUG] Respuesta completa de ${platform}:`, JSON.stringify(summonerData, null, 2));

        // C) Verificar si tenemos summonerId válido y probar Champion Mastery
        console.log(`[DEBUG] Verificando summonerId: "${summonerData.id}", tipo: ${typeof summonerData.id}`);
        
        if (summonerData.id && summonerData.id !== null && summonerData.id !== undefined && summonerData.id !== '') {
          try {
            const masteryResponse = await fetch(
              `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerData.id}`,
              {
                headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
              }
            );

            console.log(`[DEBUG] Mastery ${platform} status: ${masteryResponse.status}`);
            
            if (masteryResponse.ok) {
              const masteryData = await masteryResponse.json();
              console.log(`[DEBUG] ✅ Champion Mastery funciona en ${platform} - encontradas ${masteryData.length} maestrías`);
              console.log(`[DEBUG] Ejemplo mastery:`, masteryData[0]);
              return { platform, summonerId: summonerData.id, masteryData };
            } else {
              const errorText = await masteryResponse.text();
              console.log(`[DEBUG] ❌ Mastery falló en ${platform}:`, errorText);
            }
          } catch (masteryError) {
            console.log(`[DEBUG] ❌ Error en Mastery ${platform}:`, masteryError);
          }
        }
      } else {
        const errorText = await summonerResponse.text();
        console.log(`[DEBUG] Summoner ${platform} error:`, errorText);
      }
    } catch (error) {
      console.log(`[DEBUG] Error en ${region}/${platform}:`, error);
    }
  }

  return null;
}

// SOLUCIÓN ALTERNATIVA: Obtener summonerId usando Account API
export async function getSummonerIdViaAccount(puuid: string): Promise<{platform: string, summonerId: string} | null> {
  console.log(`[getSummonerIdViaAccount] Método alternativo para PUUID: ${puuid}`);
  
  try {
    // 1. Obtener datos de account
    const accountResponse = await fetch(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
      }
    );

    if (!accountResponse.ok) {
      console.log(`[getSummonerIdViaAccount] Account API falló: ${accountResponse.status}`);
      return null;
    }

    const accountData = await accountResponse.json();
    console.log(`[getSummonerIdViaAccount] Account data:`, accountData);

    if (!accountData.gameName || !accountData.tagLine) {
      console.log(`[getSummonerIdViaAccount] No gameName/tagLine válidos`);
      return null;
    }

    // 2. Buscar summoner por riot ID en diferentes plataformas
    const platforms = ['la1', 'la2', 'na1', 'br1'];
    
    for (const platform of platforms) {
      try {
        // Usar summoner-v4 by-name (método legacy pero a veces funciona)
        const legacyName = accountData.gameName; // Sin tagline para API legacy
        
        const summonerResponse = await fetch(
          `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(legacyName)}`,
          {
            headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
          }
        );

        console.log(`[getSummonerIdViaAccount] Summoner by-name ${platform} status: ${summonerResponse.status}`);

        if (summonerResponse.ok) {
          const summonerData = await summonerResponse.json();
          console.log(`[getSummonerIdViaAccount] Summoner by-name ${platform} data:`, summonerData);
          
          // Verificar que el PUUID coincida
          if (summonerData.puuid === puuid && summonerData.id) {
            console.log(`[getSummonerIdViaAccount] ✅ PUUID match en ${platform}, summonerId: ${summonerData.id}`);
            return { platform, summonerId: summonerData.id };
          }
        }
      } catch (error) {
        console.log(`[getSummonerIdViaAccount] Error en ${platform}:`, error);
      }
    }

    return null;
  } catch (error) {
    console.error(`[getSummonerIdViaAccount] Error:`, error);
    return null;
  }
}

// 2. FUNCIÓN DE CHAMPION MASTERY CORREGIDA CON MÚLTIPLES MÉTODOS
export async function getChampionMasteryByPuuid(puuid: string) {
      // Iniciando para PUUID
  
  // Método 1: Usar el debug detallado
  let result = await debugSummonerData(puuid);
  
  // Si el resultado es de tipo debugSummonerData (tiene masteryData)
  if (result && typeof result === 'object' && 'masteryData' in result) {
    // Usando plataforma encontrada
    return result.masteryData;
  }
  
  // Método 2: Si el método 1 falla, probar con Account API
  if (!result) {
    // Método 1 falló, probando método alternativo
    const accountResult = await getSummonerIdViaAccount(puuid);
    
    if (accountResult) {
      // Obtener mastery con el summonerId encontrado
      try {
        const masteryResponse = await fetch(
          `https://${accountResult.platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${accountResult.summonerId}`,
          {
            headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
          }
        );

        if (masteryResponse.ok) {
          const masteryData = await masteryResponse.json();
          return masteryData;
        }
      } catch (masteryError) {
        // Error en mastery método alternativo
      }
    }
  }
  
  throw new Error(`No se pudo encontrar summoner data para PUUID: ${puuid}`);
}

// Función para obtener URLs de imágenes con fallback de versiones
export async function getImageUrlWithFallback(type: string, name: string): Promise<string> {
  const version = await getLatestVersion();
  const baseUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/${type}/${name}.png`;
  
  // Si necesitas verificar si la imagen existe
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(baseUrl);
    img.onerror = async () => {
      // Fallback usando el sistema de Data Dragon
      try {
        const fallbackVersion = await getValidDataDragonVersion();
        resolve(`https://ddragon.leagueoflegends.com/cdn/${fallbackVersion}/img/${type}/${name}.png`);
      } catch {
        // Último fallback hardcodeado
        resolve(`https://ddragon.leagueoflegends.com/cdn/14.22.1/img/${type}/${name}.png`);
      }
    };
    img.src = baseUrl;
  });
}

// Función para extraer participante por PUUID
function extractParticipantForPuuid(match: any, puuid: string) {
  const participant = match.info.participants.find((p: any) => p.puuid === puuid);
  if (participant) {
    const kda = participant.deaths > 0 
      ? ((participant.kills + participant.assists) / participant.deaths)
      : participant.kills + participant.assists;
    return { ...participant, kda };
  }
  return null;
}

// Función alternativa: Champion Mastery desde Match History
export async function getChampionMasteryFromMatches(puuid: string, championId?: number) {
  // Método alternativo para PUUID
  
  try {
    // Obtener historial de matches
    const matchesResponse = await fetch(
      `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=100`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
      }
    );

    if (!matchesResponse.ok) {
      throw new Error(`Failed to get matches: ${matchesResponse.status}`);
    }

    const matchIds = await matchesResponse.json();
    // Encontrados matches

    // Analizar matches para calcular "mastery" aproximada
    const championStats: { [championId: number]: { games: number, wins: number, totalKda: number } } = {};

    for (const matchId of matchIds.slice(0, 20)) { // Solo primeros 20 para no exceder rate limit
      try {
        const matchResponse = await fetch(
          `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`,
          {
            headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
          }
        );

        if (matchResponse.ok) {
          const match = await matchResponse.json();
          const participant = extractParticipantForPuuid(match, puuid);
          
          if (participant) {
            const champ = participant.championId;
            if (!championStats[champ]) {
              championStats[champ] = { games: 0, wins: 0, totalKda: 0 };
            }
            
            championStats[champ].games++;
            if (participant.win) championStats[champ].wins++;
            championStats[champ].totalKda += participant.kda;
          }
        }
      } catch (matchError) {
        // Error en match
      }
    }

    // Convertir stats en formato similar a mastery
    const estimatedMastery = Object.entries(championStats).map(([championId, stats]) => ({
      championId: parseInt(championId),
      championLevel: Math.min(7, Math.floor(stats.games / 5) + 1), // Estimación basada en juegos
      championPoints: stats.games * 100, // Estimación
      lastPlayTime: Date.now(),
      championPointsSinceLastLevel: 0,
      championPointsUntilNextLevel: 500,
      chestGranted: false,
      tokensEarned: 0,
      summonerId: 'estimated', // No tenemos el real
      // Stats adicionales que calculamos
      gamesPlayed: stats.games,
      winRate: Math.round((stats.wins / stats.games) * 100) / 100,
      averageKda: Math.round((stats.totalKda / stats.games) * 100) / 100
    })).sort((a, b) => b.championPoints - a.championPoints);

    return estimatedMastery;

  } catch (error) {
    console.error(`[getChampionMasteryFromMatches] Error:`, error);
    throw error;
  }
}

// Función para obtener versión actual de Data Dragon
export { getLatestVersion };

// Función para obtener summoner por PUUID
export async function getSummonerByPuuid(puuid: string, platform: string = 'la2') {
  try {
    const response = await fetch(
      `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get summoner: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[getSummonerByPuuid] Error:`, error);
    throw error;
  }
}