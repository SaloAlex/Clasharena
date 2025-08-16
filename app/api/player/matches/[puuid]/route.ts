import { NextRequest, NextResponse } from 'next/server';
import { riotApi } from '@/lib/riot/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { puuid: string } }
) {
  try {
    const puuid = params.puuid;
    const searchParams = request.nextUrl.searchParams;
    const count = parseInt(searchParams.get('count') || '10');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!puuid) {
      return NextResponse.json(
        { error: 'PUUID es requerido' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key de Riot no configurada' },
        { status: 500 }
      );
    }

    // Por ahora asumimos que todos los usuarios son de AMERICAS
    const routing = 'AMERICAS';

    riotApi.setRouting(routing);

    // Obtener IDs de partidas
    const matchIds = await riotApi.getMatchIds({
      puuid: puuid,
      count: count,
      startTime: startTime ? parseInt(startTime) : undefined,
      endTime: endTime ? parseInt(endTime) : undefined,
    });

    // Obtener datos de campeones y colas para enriquecer la respuesta
    const [championsData, queuesData] = await Promise.all([
      riotApi.getChampions().catch(() => ({ data: {} })),
      riotApi.getQueues().catch(() => [])
    ]);

    // Crear mapeos para búsqueda rápida
    const championMap: { [key: string]: { name: string; title: string; image: string; } } = Object.values(championsData.data).reduce((acc, champion: any) => {
      acc[champion.key] = {
        name: champion.name,
        title: champion.title,
        image: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.image.full}`
      };
      return acc;
    }, {});

    const queueMap = queuesData.reduce((acc: any, queue: any) => {
      acc[queue.queueId] = {
        description: queue.description,
        map: queue.map
      };
      return acc;
    }, {});

    // Obtener detalles de las partidas
    const matches = await Promise.all(
      matchIds.slice(0, Math.min(count, 20)).map(async (matchId: string) => {
        try {
          const matchData = await riotApi.getMatch(matchId);
          const player = matchData.info.participants.find((p: any) => p.puuid === puuid);
          
          if (!player) return null;

          const champion = championMap[player.championId] || { name: 'Unknown', title: '', image: '' };
          const queue = queueMap[matchData.info.queueId] || { description: 'Unknown Queue', map: 'Unknown' };

          // Convertir la posición a un formato más amigable
          let position = 'Invalid';
          if (matchData.info.queueId === 420) { // Cola clasificatoria
            position = player.individualPosition || player.lane || 'Invalid';
          } else if (matchData.info.queueId === 450) { // ARAM
            position = 'ARAM';
          } else if (matchData.info.queueId === 400) { // Normal Draft
            position = player.individualPosition || player.lane || 'Invalid';
          } else if (matchData.info.queueId === 430) { // Normal Blind
            position = player.individualPosition || player.lane || 'Invalid';
          }

          // Asegurarnos de que gameCreation sea un timestamp válido
          const gameCreation = matchData.info.gameStartTimestamp || matchData.info.gameCreation;
          
          return {
            matchId: matchId,
            gameCreation: gameCreation,
            gameDuration: Math.floor(matchData.info.gameDuration / 60), // en minutos
            queue: {
              id: matchData.info.queueId,
              description: queue.description,
              map: queue.map
            },
            champion: {
              id: player.championId,
              name: champion.name,
              title: champion.title,
              image: champion.image
            },
            stats: {
              win: player.win,
              kills: player.kills,
              deaths: player.deaths,
              assists: player.assists,
              kda: player.deaths > 0 ? ((player.kills + player.assists) / player.deaths).toFixed(2) : 'Perfect',
              cs: player.totalMinionsKilled + player.neutralMinionsKilled,
              gold: player.goldEarned,
              damageDealt: player.totalDamageDealtToChampions,
              visionScore: player.visionScore || 0
            },
            team: {
              teamId: player.teamId,
              position: position,
              lane: player.lane
            }
          };
        } catch (error) {
          console.error(`Error obteniendo partida ${matchId}:`, error);
          return null;
        }
      })
    );

    const validMatches = matches.filter(match => match !== null);

    return NextResponse.json({
      success: true,
      puuid: puuid,
      routing: routing,
      matches: validMatches,
      total: validMatches.length,
      requested: count
    });

  } catch (error: any) {
    console.error('Error obteniendo partidas del jugador:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Error al obtener partidas del jugador'
    }, { status: 500 });
  }
}
