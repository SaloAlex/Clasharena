import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getRecentMatchIds, getMatchDetails, toRegionalFromPlatform } from '@/lib/riot';
import { getChampionImageUrl, getSpellImageUrl, getItemImageUrl } from '@/lib/data-dragon';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Función para procesar los datos de una partida
async function processMatchData(matchData: any, puuid: string) {
  try {
    // Encontrar al jugador en la partida
    const player = matchData.info.participants.find((p: any) => p.puuid === puuid);
    if (!player) {

      return null;
    }

    // Obtener información del campeón
    const championId = player.championId;
    const championName = player.championName;
    

    
    // Obtener URL de imagen del campeón usando el nuevo sistema
    // Usar championId directamente para mayor confiabilidad
    const championImage = await getChampionImageUrl(championId);

    // Calcular KDA
    const kda = player.deaths > 0 
      ? ((player.kills + player.assists) / player.deaths).toFixed(2)
      : 'Perfect';

    // Procesar items (solo items válidos)
    const items = [];
    for (let i = 0; i <= 6; i++) {
      const itemId = player[`item${i}`];
      if (itemId && itemId !== 0 && itemId < 100000) { // Filtrar items válidos
        try {
          const itemImage = await getItemImageUrl(itemId);
          items.push({
            name: `Item ${itemId}`,
            image: itemImage,
            gold: 0
          });
        } catch (error) {
          console.warn(`[processMatchData] Error obteniendo imagen para item ${itemId}:`, error);
          // Incluir el item sin imagen para que el componente DataDragonImage maneje el fallback
          items.push({
            name: `Item ${itemId}`,
            image: `https://ddragon.leagueoflegends.com/cdn/14.22.1/img/item/${itemId}.png`,
            gold: 0
          });
        }
      }
    }

    // Procesar hechizos de invocador
    const getSummonerSpellName = (id: number) => {
      const spells: { [key: number]: string } = {
        4: 'Flash',
        12: 'Teleport',
        6: 'Haste', // Ghost se llama Haste en Data Dragon
        7: 'Heal',
        11: 'Smite',
        3: 'Exhaust',
        14: 'Ignite',
        1: 'Cleanse',
        21: 'Barrier'
      };
      return spells[id] || 'Flash'; // Default a Flash en lugar de Unknown
    };

    const summonerSpells = {
      d: {
        name: getSummonerSpellName(player.summoner1Id),
        image: await getSpellImageUrl(`Summoner${getSummonerSpellName(player.summoner1Id)}`)
      },
      f: {
        name: getSummonerSpellName(player.summoner2Id),
        image: await getSpellImageUrl(`Summoner${getSummonerSpellName(player.summoner2Id)}`)
      }
    };

    return {
      matchId: matchData.info.gameId.toString(),
      gameCreation: matchData.info.gameCreation,
      gameDuration: Math.round(matchData.info.gameDuration / 60), // Convertir a minutos
      queue: {
        id: matchData.info.queueId,
        description: matchData.info.gameMode || 'Unknown',
        map: matchData.info.mapId.toString()
      },
      champion: {
        id: championId,
        name: championName, // Mantener nombre original para display
        title: championName, // TODO: Obtener título real
        image: championImage
      },
      stats: {
        win: player.win,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        kda,
        cs: player.totalMinionsKilled + player.neutralMinionsKilled,
        gold: player.goldEarned,
        damageDealt: player.totalDamageDealtToChampions,
        visionScore: player.visionScore
      },
      team: {
        teamId: player.teamId,
        position: player.individualPosition || player.role,
        lane: player.lane
      },
      build: {
        summonerSpells,
        items,
        runes: {
          // TODO: Procesar runas cuando estén disponibles
        }
      }
    };
  } catch (error) {
    console.error('[processMatchData] Error procesando partida:', error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const puuid = searchParams.get('puuid');
    let platform = searchParams.get('platform');
    const count = Math.min(Math.max(Number(searchParams.get('count') ?? 10), 1), 20);

    if (!puuid) return NextResponse.json({ ok: false, error: 'puuid requerido' }, { status: 400 });

    const supabase = createRouteHandlerClient({ cookies });
    if (!platform) {
      const { data } = await supabase.from('riot_accounts')
        .select('platform').eq('puuid', puuid).maybeSingle();
      platform = data?.platform ?? process.env.RIOT_PLATFORM ?? 'LA2';
    }

    const region = toRegionalFromPlatform(platform);
    const ids = await getRecentMatchIds(puuid, region, count);

    const rawMatches: any[] = [];
    for (let i = 0; i < ids.length; i += 4) {
      const batch = ids.slice(i, i + 4).map(id => 
        getMatchDetails(id, region).catch(err => ({ id, _error: String(err) }))
      );
      rawMatches.push(...await Promise.all(batch));
    }

         // Procesar las partidas para el formato esperado
     const processedMatches = await Promise.all(
       rawMatches
         .filter(match => !match._error) // Filtrar partidas con error
         .map(match => processMatchData(match, puuid))
     );
     
     const validMatches = processedMatches.filter(match => match !== null); // Filtrar partidas que no se pudieron procesar

         return NextResponse.json({ ok: true, data: { ids, matches: validMatches } });
  } catch (e: any) {
    console.error('[API player/matches]', e);
    return NextResponse.json({ ok: false, error: e.message ?? 'Internal error' }, { status: 500 });
  }
}