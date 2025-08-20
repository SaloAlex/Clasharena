// VERSIÓN OPTIMIZADA - Sin logs innecesarios y más eficiente

interface ChampionMasteryData {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  summonerId?: string;
  // Campos estimados para método alternativo
  gamesPlayed?: number;
  winRate?: number;
  averageKda?: number;
  isEstimated?: boolean;
}

// Cache para evitar llamadas repetidas
const masteryCache = new Map<string, { data: ChampionMasteryData[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// MÉTODO PRINCIPAL - Simplificado y optimizado
export async function getChampionMasteryOptimized(puuid: string): Promise<ChampionMasteryData[]> {
  // Verificar cache primero
  const cached = masteryCache.get(puuid);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Intentar método oficial SOLO UNA VEZ
    const officialData = await tryOfficialMastery(puuid);
    if (officialData) {
      masteryCache.set(puuid, { data: officialData, timestamp: Date.now() });
      return officialData;
    }
  } catch (error) {
    // Método oficial no disponible, usando alternativo
  }

  // Método alternativo
  const alternativeData = await getChampionMasteryFromMatches(puuid);
  
  masteryCache.set(puuid, { data: alternativeData, timestamp: Date.now() });
  return alternativeData;
}

// MÉTODO OFICIAL - Simplificado, sin debugging excesivo
async function tryOfficialMastery(puuid: string): Promise<ChampionMasteryData[] | null> {
  // Solo probar la plataforma más probable basada en análisis previo
  const platformsToTry = ['la2', 'la1', 'na1']; // la2 es donde encontramos el summoner antes
  
  for (const platform of platformsToTry) {
    try {
      const summonerResponse = await fetch(
        `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        {
          headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
        }
      );

      if (summonerResponse.ok) {
        const summonerData = await summonerResponse.json();
        
        // Verificar si tiene summonerId válido
        if (summonerData.id && summonerData.id !== null) {
          const masteryResponse = await fetch(
            `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerData.id}`,
            {
              headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
            }
          );

          if (masteryResponse.ok) {
            const masteryData = await masteryResponse.json();
            return masteryData.map((mastery: any) => ({
              ...mastery,
              isEstimated: false
            }));
          }
        }
      }
    } catch (error) {
      // Silenciar errores esperados
    }
  }

  return null;
}

// Función para extraer participante por PUUID
function extractParticipantForPuuid(match: any, puuid: string) {
  const participant = match.info.participants.find((p: any) => p.puuid === puuid);
  if (participant) {
    const kda = participant.deaths > 0 
      ? ((participant.kills + participant.assists) / participant.deaths)
      : participant.kills + participant.assists;
    return { 
      ...participant, 
      kda,
      gameStart: match.info.gameCreation
    };
  }
  return null;
}

// MÉTODO ALTERNATIVO - Optimizado y mejorado
async function getChampionMasteryFromMatches(puuid: string): Promise<ChampionMasteryData[]> {
  try {
    // Obtener más matches para mejor precisión
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
    
    // Procesar matches en paralelo (pero limitado para evitar rate limit)
    const matchDataPromises = matchIds.slice(0, 50).map(async (matchId: string) => {
      try {
        const matchResponse = await fetch(
          `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`,
          {
            headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! },
          }
        );

        if (matchResponse.ok) {
          const match = await matchResponse.json();
          return extractParticipantForPuuid(match, puuid);
        }
      } catch (error) {
        // Silenciar errores individuales de matches
        return null;
      }
      return null;
    });

    const matchResults = await Promise.all(matchDataPromises);
    const validMatches = matchResults.filter(Boolean);

    // Calcular estadísticas por campeón
    const championStats: { [championId: number]: {
      games: number;
      wins: number;
      totalKda: number;
      totalKills: number;
      totalDeaths: number;
      totalAssists: number;
      recentGames: number;
      lastPlayTime: number;
    }} = {};

    validMatches.forEach((participant) => {
      if (!participant) return;
      
      const champ = participant.championId;
      if (!championStats[champ]) {
        championStats[champ] = {
          games: 0,
          wins: 0,
          totalKda: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalAssists: 0,
          recentGames: 0,
          lastPlayTime: 0
        };
      }

      const stats = championStats[champ];
      stats.games++;
      if (participant.win) stats.wins++;
      stats.totalKda += participant.kda;
      stats.totalKills += participant.kills;
      stats.totalDeaths += participant.deaths;
      stats.totalAssists += participant.assists;
      stats.lastPlayTime = Math.max(stats.lastPlayTime, participant.gameStart);
      
      // Contar juegos recientes (últimas 2 semanas)
      const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
      if (participant.gameStart > twoWeeksAgo) {
        stats.recentGames++;
      }
    });

    // Convertir a formato de mastery con cálculos más precisos
    const estimatedMastery = Object.entries(championStats).map(([championId, stats]) => {
      const winRate = stats.wins / stats.games;
      const avgKda = stats.totalKda / stats.games;
      
      // Calcular nivel de mastery más realista
      let masteryLevel = 1;
      let masteryPoints = 0;
      
      // Algoritmo mejorado basado en juegos, performance y recencia
      const basePoints = stats.games * 150; // Base por juego
      const performanceBonus = Math.floor(avgKda * 50); // Bonus por KDA
      const winBonus = Math.floor(winRate * 200); // Bonus por winrate
      const recentBonus = stats.recentGames * 25; // Bonus por actividad reciente
      
      masteryPoints = basePoints + performanceBonus + winBonus + recentBonus;
      
      // Calcular nivel basado en puntos (aproximación del sistema real)
      if (masteryPoints >= 21600) masteryLevel = 7;
      else if (masteryPoints >= 12600) masteryLevel = 6;
      else if (masteryPoints >= 6000) masteryLevel = 5;
      else if (masteryPoints >= 2800) masteryLevel = 4;
      else if (masteryPoints >= 1200) masteryLevel = 3;
      else if (masteryPoints >= 400) masteryLevel = 2;

      return {
        championId: parseInt(championId),
        championLevel: masteryLevel,
        championPoints: masteryPoints,
        lastPlayTime: stats.lastPlayTime,
        championPointsSinceLastLevel: 0,
        championPointsUntilNextLevel: masteryLevel < 7 ? 1000 : 0,
        chestGranted: false,
        tokensEarned: 0,
        summonerId: 'estimated',
        // Stats adicionales
        gamesPlayed: stats.games,
        winRate: Math.round(winRate * 100) / 100,
        averageKda: Math.round(avgKda * 100) / 100,
        isEstimated: true
      };
    }).sort((a, b) => {
      // Ordenar por level primero, luego por puntos
      if (a.championLevel !== b.championLevel) {
        return b.championLevel - a.championLevel;
      }
      return b.championPoints - a.championPoints;
    });

    return estimatedMastery;

  } catch (error) {
    throw error;
  }
}

// UTILIDADES ADICIONALES

// Limpiar cache manualmente si es necesario
export function clearMasteryCache(puuid?: string) {
  if (puuid) {
    masteryCache.delete(puuid);
  } else {
    masteryCache.clear();
  }
}

// Obtener estadísticas de cache
export function getCacheStats() {
  const entries = Array.from(masteryCache.entries());
  const values = Array.from(masteryCache.values());
  
  return {
    entries: masteryCache.size,
    memoryUsage: JSON.stringify(entries).length,
    oldestEntry: values.length > 0 ? Math.min(...values.map(v => v.timestamp)) : 0
  };
}
