// lib/riot/client.ts
const RIOT_API_KEY = process.env.RIOT_API_KEY ?? '';

if (!RIOT_API_KEY) {
  console.warn('[RIOT] Falta RIOT_API_KEY en el entorno');
}

type Platform =
  | 'br1' | 'eun1' | 'euw1' | 'jp1' | 'kr'
  | 'la1' | 'la2' | 'na1' | 'oc1' | 'tr1' | 'ru';

const VALID_PLATFORMS: Platform[] = [
  'br1','eun1','euw1','jp1','kr','la1','la2','na1','oc1','tr1','ru'
];

function platformHost(p: string) {
  return `${p}.api.riotgames.com`;
}

// Backoff simple para 429 y sin cache
async function fetchWithRetry(url: string, init?: RequestInit, tries = 3): Promise<Response> {
  const headers = {
    'X-Riot-Token': RIOT_API_KEY,
    ...(init?.headers || {})
  };

  for (let i = 0; i < tries; i++) {
    console.log(`[RIOT] Intento ${i + 1}/${tries} para ${url}`);
    console.log('[RIOT] Headers:', headers);

    const res = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers
    });

    // Log de la respuesta para debugging
    console.log(`[RIOT] Status: ${res.status} ${res.statusText}`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log('[RIOT] Error response:', text);
    }

    if (res.status !== 429) return res;

    const retryAfter = Number(res.headers.get('Retry-After')) || 2;
    console.log(`[RIOT] Rate limited, waiting ${retryAfter} seconds`);
    await new Promise(r => setTimeout(r, (retryAfter + 1) * 1000));
  }

  return fetch(url, {
    ...init,
    cache: 'no-store',
    headers
  });
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[RIOT RESP ERROR]', res.status, res.statusText, text);
    throw new Error(`Riot API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface SummonerDTO {
  id: string;               // encryptedSummonerId
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface LeagueEntryDTO {
  leagueId: string;
  queueType: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | string;
  tier: string;
  rank: string;
  summonerId: string;       // encryptedSummonerId
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
  miniSeries?: {
    losses: number;
    progress: string;
    target: number;
    wins: number;
  }
}

type Region = 'americas' | 'europe' | 'asia' | 'sea';

const PLATFORM_TO_REGION: Record<Platform, Region> = {
  'br1': 'americas',
  'la1': 'americas',
  'la2': 'americas',
  'na1': 'americas',
  'eun1': 'europe',
  'euw1': 'europe',
  'tr1': 'europe',
  'ru': 'europe',
  'jp1': 'asia',
  'kr': 'asia',
  'oc1': 'sea'
};

class RiotApi {
  private currentRegion: Region = 'americas';

  constructor() {
    if (!RIOT_API_KEY) {
      throw new Error('RIOT_API_KEY no está configurada en el entorno');
    }
  }

  setRegion(region: Region) {
    this.currentRegion = region;
  }

  getRegionFromPlatform(platform: Platform): Region {
    return PLATFORM_TO_REGION[platform] || 'americas';
  }

  /**
   * Summoner por PUUID (usa host de plataforma: la2, na1, euw1, etc.)
   */
  async getRiotAccount(puuid: string): Promise<any> {
    const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;
    return fetchJson(url);
  }

  async getSummonerByPuuid(puuid: string, platform: Platform): Promise<SummonerDTO> {
    const p = platform.toLowerCase() as Platform;
    if (!VALID_PLATFORMS.includes(p)) {
      throw new Error(`Plataforma inválida: ${platform}`);
    }
    const url = `https://${platformHost(p)}/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    return fetchJson<SummonerDTO>(url);
  }

  async getSummonerByRiotId(gameName: string, tagLine: string, platform: Platform): Promise<SummonerDTO> {
    const p = platform.toLowerCase() as Platform;
    if (!VALID_PLATFORMS.includes(p)) {
      throw new Error(`Plataforma inválida: ${platform}`);
    }
    const url = `https://${platformHost(p)}/lol/summoner/v4/summoners/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    return fetchJson<SummonerDTO>(url);
  }

  /**
   * Entradas de liga por encryptedSummonerId (League-v4) — también usa plataforma
   */
  async getLeagueEntries(encryptedSummonerId: string, platform: Platform): Promise<LeagueEntryDTO[]> {
    const p = platform.toLowerCase() as Platform;
    if (!VALID_PLATFORMS.includes(p)) {
      throw new Error(`Plataforma inválida: ${platform}`);
    }
    console.log(`[RIOT] Obteniendo entradas de liga para ${encryptedSummonerId} en ${p}`);
    const url = `https://${platformHost(p)}/lol/league/v4/entries/by-summoner/${encodeURIComponent(encryptedSummonerId)}`;
    return fetchJson<LeagueEntryDTO[]>(url);
  }

  /**
   * Obtiene la maestría de campeones de un invocador
   */
  async getChampionMasteryByPUUID(puuid: string, platform: Platform): Promise<any[]> {
    const p = platform.toLowerCase() as Platform;
    if (!VALID_PLATFORMS.includes(p)) {
      throw new Error(`Plataforma inválida: ${platform}`);
    }
    const url = `https://${platformHost(p)}/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}`;
    return fetchJson<any[]>(url);
  }

  /**
   * Obtiene IDs de partidas por PUUID (usa región: americas, europe, asia)
   */
  async getMatchIds(params: {
    puuid: string;
    startTime?: number;
    endTime?: number;
    queue?: number;
    type?: string;
    start?: number;
    count?: number;
  }): Promise<string[]> {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'puuid' && value !== undefined) {
        query.append(key, value.toString());
      }
    });

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const url = `https://${this.currentRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(params.puuid)}/ids${queryString}`;
    return fetchJson<string[]>(url);
  }

  /**
   * Obtiene detalles de una partida por ID (usa región: americas, europe, asia)
   */
  async getMatch(matchId: string): Promise<any> {
    const url = `https://${this.currentRegion}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`;
    return fetchJson(url);
  }

  /**
   * Obtiene datos de campeones desde Data Dragon
   */
  async getChampions(): Promise<any> {
    const url = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/data/es_ES/champion.json';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Champions API error ${res.status}`);
    return res.json();
  }

  /**
   * Obtiene datos de objetos desde Data Dragon
   */
  async getItems(): Promise<any> {
    const url = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/data/es_ES/item.json';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Items API error ${res.status}`);
    return res.json();
  }

  /**
   * Obtiene datos de runas desde Data Dragon
   */
  async getRunes(): Promise<any> {
    const url = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/data/es_ES/runesReforged.json';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Runes API error ${res.status}`);
    return res.json();
  }

  /**
   * Obtiene datos de hechizos de invocador desde Data Dragon
   */
  async getSummonerSpells(): Promise<any> {
    const url = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/data/es_ES/summoner.json';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Summoner spells API error ${res.status}`);
    return res.json();
  }

  /**
   * Obtiene datos de colas desde el CDN de Riot
   */
  async getQueues(): Promise<any> {
    const url = 'https://static.developer.riotgames.com/docs/lol/queues.json';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Queues API error ${res.status}`);
    return res.json();
  }
}

// Verificar la API key al inicializar
if (!RIOT_API_KEY) {
  console.error('[RIOT] ERROR CRÍTICO: RIOT_API_KEY no está configurada');
  throw new Error('RIOT_API_KEY no está configurada');
}

export const riotApi = new RiotApi();
export { VALID_PLATFORMS };