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
    const platform = (searchParams.get('region') || 'la2').toLowerCase();

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
    const region = riotApi.getRegionFromPlatform(platform as any);
    
    riotApi.setRegion(region);

    // Obtener IDs de partidas
    const matchIds = await riotApi.getMatchIds({
      puuid: puuid,
      count: count,
      startTime: startTime ? parseInt(startTime) : undefined,
      endTime: endTime ? parseInt(endTime) : undefined,
    });

    // Obtener datos estáticos para enriquecer la respuesta
    const [championsData, queuesData, itemsData, runesData, summonerSpellsData] = await Promise.all([
      riotApi.getChampions().catch(() => ({ data: {} })),
      riotApi.getQueues().catch(() => []),
      riotApi.getItems().catch(() => ({ data: {} })),
      riotApi.getRunes().catch(() => []),
      riotApi.getSummonerSpells().catch(() => ({ data: {} }))
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

    // Mapeo de objetos
    const itemMap = Object.entries(itemsData.data || {}).reduce((acc: any, [id, item]: [string, any]) => {
      acc[id] = {
        name: item.name,
        description: item.description,
        image: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/${id}.png`,
        gold: item.gold.total,
        tags: item.tags
      };
      return acc;
    }, {});

    // Mapeo de runas
    const runeMap = runesData.reduce((acc: any, tree: any) => {
      // Agregar el árbol principal
      acc[tree.id] = {
        name: tree.name,
        icon: `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`,
        key: tree.key
      };
      // Agregar las runas individuales
      tree.slots.forEach((slot: any) => {
        slot.runes.forEach((rune: any) => {
          acc[rune.id] = {
            name: rune.name,
            icon: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`,
            key: rune.key,
            shortDesc: rune.shortDesc,
            tree: tree.name
          };
        });
      });
      return acc;
    }, {});

    // Mapeo de hechizos de invocador
    const summonerSpellMap = Object.values(summonerSpellsData.data || {}).reduce((acc: any, spell: any) => {
      acc[spell.key] = {
        name: spell.name,
        description: spell.description,
        image: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/spell/${spell.image.full}`
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
              visionScore: player.visionScore || 0,
              level: player.champLevel
            },
            build: {
              items: [
                player.item0 ? itemMap[player.item0] : null,
                player.item1 ? itemMap[player.item1] : null,
                player.item2 ? itemMap[player.item2] : null,
                player.item3 ? itemMap[player.item3] : null,
                player.item4 ? itemMap[player.item4] : null,
                player.item5 ? itemMap[player.item5] : null,
                player.item6 ? itemMap[player.item6] : null, // Trinket
              ].filter(Boolean),
              runes: {
                primary: {
                  style: runeMap[player.perks?.styles?.[0]?.style] || null,
                  selected: player.perks?.styles?.[0]?.selections?.map((selection: any) => runeMap[selection.perk]) || []
                },
                secondary: {
                  style: runeMap[player.perks?.styles?.[1]?.style] || null,
                  selected: player.perks?.styles?.[1]?.selections?.map((selection: any) => runeMap[selection.perk]) || []
                }
              },
              summonerSpells: {
                d: summonerSpellMap[player.summoner1Id] || null,
                f: summonerSpellMap[player.summoner2Id] || null
              }
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
      region: region,
      matches: validMatches,
      total: validMatches.length,
      requested: count
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Error al obtener partidas del jugador'
    }, { status: 500 });
  }
}
