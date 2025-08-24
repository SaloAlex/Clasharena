import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getRecentMatchIds, getMatchDetails, toRegionalFromPlatform } from '@/lib/riot';

interface MatchResult {
  win: boolean;
  firstBlood: boolean;
  firstTower: boolean;
  perfectGame: boolean;
  queueId: number;
}

// Mapeo de queue IDs a tipos de cola
const QUEUE_ID_MAP: Record<number, string> = {
  400: 'normal_draft',
  420: 'ranked_solo',
  430: 'normal_blind',
  440: 'ranked_flex',
  450: 'aram',
  700: 'clash',
  900: 'urf',
  1020: 'one_for_all',
  1300: 'nexus_blitz',
  1400: 'ultimate_spellbook',
  1700: 'arena',
  1900: 'urf',
  2000: 'tutorial',
  2010: 'tutorial',
  2020: 'tutorial',
};

// Función principal de escaneo
async function scanMatches() {
  const supabase = createRouteHandlerClient({ cookies });

  // Obtener todos los torneos activos
  const { data: activeTournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('status', 'active')
    .lt('start_at', new Date().toISOString())
    .gt('end_at', new Date().toISOString());

  if (tournamentsError) throw tournamentsError;

  let processedMatches = 0;
  let newPoints = 0;

  for (const tournament of activeTournaments || []) {
    console.log(`🔍 Procesando torneo: ${tournament.title}`);

    // Obtener configuración de colas habilitadas
    const queues = tournament.queues || {};
    const enabledQueueIds = Object.entries(queues)
      .filter(([_, config]: [string, any]) => config.enabled)
      .map(([_, config]: [string, any]) => config.id);

    console.log(`📋 Colas habilitadas:`, enabledQueueIds);

    // Obtener registraciones del torneo
    const { data: registrations, error: registrationsError } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournament.id);

    if (registrationsError) {
      console.error(`Error obteniendo registraciones para torneo ${tournament.id}:`, registrationsError);
      continue;
    }

    if (!registrations || registrations.length === 0) {
      console.log(`⚠️ No hay registraciones para el torneo ${tournament.title}`);
      continue;
    }

    // Obtener cuentas de Riot para estos usuarios
    const { data: riotAccounts, error: riotError } = await supabase
      .from('riot_accounts')
      .select('*')
      .in('user_id', registrations.map(r => r.user_id))
      .eq('verified', true);

    if (riotError) {
      console.error(`Error obteniendo cuentas de Riot para torneo ${tournament.id}:`, riotError);
      continue;
    }

    // Combinar datos
    const registrationsWithAccounts = registrations.map(registration => ({
      ...registration,
      riot_account: riotAccounts?.find(account => account.user_id === registration.user_id)
    }));

    for (const registration of registrationsWithAccounts) {
      const riotAccount = registration.riot_account;
      if (!riotAccount?.puuid) {
        console.log(`⚠️ Usuario ${registration.user_id} no tiene cuenta de Riot`);
        continue;
      }

      console.log(`🎮 Procesando usuario: ${riotAccount.game_name}#${riotAccount.tag_line}`);

      try {
        // Obtener última partida procesada para este usuario en este torneo
        const { data: lastMatch } = await supabase
          .from('match_records')
          .select('game_start')
          .eq('tournament_id', tournament.id)
          .eq('registration_id', registration.id)
          .order('game_start', { ascending: false })
          .limit(1)
          .single();

        // Calcular tiempo de inicio para buscar partidas
        const startTime = lastMatch 
          ? Math.floor(new Date(lastMatch.game_start).getTime() / 1000)
          : Math.floor(new Date(registration.created_at).getTime() / 1000);

        const endTime = Math.floor(new Date(tournament.end_at).getTime() / 1000);

        console.log(`📅 Buscando partidas desde ${new Date(startTime * 1000).toISOString()} hasta ${new Date(endTime * 1000).toISOString()}`);

        // Obtener partidas recientes de Riot API
        const region = toRegionalFromPlatform(riotAccount.platform);
        const matchIds = await getRecentMatchIds(riotAccount.puuid, region, 20);

        console.log(`🎯 Encontradas ${matchIds.length} partidas recientes`);

        for (const matchId of matchIds) {
          // Verificar si ya procesamos esta partida para este torneo
          const { data: existingMatch } = await supabase
            .from('match_records')
            .select('id')
            .eq('match_id', matchId)
            .eq('tournament_id', tournament.id)
            .eq('registration_id', registration.id)
            .single();

          if (existingMatch) {
            console.log(`⏭️ Partida ${matchId} ya procesada`);
            continue;
          }

          // Obtener detalles de la partida
          const matchData = await getMatchDetails(matchId, region);
          
          // Encontrar al jugador en la partida
          const player = matchData.info.participants.find(
            (p: any) => p.puuid === riotAccount.puuid
          );

          if (!player) {
            console.log(`❌ Jugador no encontrado en partida ${matchId}`);
            continue;
          }

          // Verificar si la cola está habilitada para este torneo
          if (!enabledQueueIds.includes(matchData.info.queueId)) {
            console.log(`🚫 Cola ${matchData.info.queueId} no habilitada para torneo`);
            continue;
          }

          // Verificar si la partida está dentro del periodo del torneo
          const gameStartTime = new Date(matchData.info.gameStartTimestamp);
          if (gameStartTime < new Date(registration.created_at) || 
              gameStartTime > new Date(tournament.end_at)) {
            console.log(`📅 Partida fuera del periodo del torneo: ${gameStartTime.toISOString()}`);
            continue;
          }

          console.log(`✅ Procesando partida ${matchId} - Cola: ${matchData.info.queueId} - Victoria: ${player.win}`);

          // Encontrar el multiplicador para esta cola
          const queueConfig = Object.values(queues).find((q: any) => q.id === matchData.info.queueId);
          const multiplier = (queueConfig as any)?.pointMultiplier || 1;

          // Calcular puntos base
          const matchResult: MatchResult = {
            win: player.win,
            firstBlood: player.firstBloodKill || player.firstBloodAssist,
            firstTower: player.firstTowerKill || player.firstTowerAssist,
            perfectGame: player.deaths === 0 && player.assists > 0,
            queueId: matchData.info.queueId
          };

          let points = 0;
          const reasons: string[] = [];

          if (matchResult.win) {
            points += tournament.points_per_win;
            reasons.push('victoria');
          } else {
            points += tournament.points_per_loss;
            reasons.push('derrota');
          }

          if (matchResult.firstBlood) {
            points += tournament.points_first_blood;
            reasons.push('primera_sangre');
          }

          if (matchResult.firstTower) {
            points += tournament.points_first_tower;
            reasons.push('primera_torre');
          }

          if (matchResult.perfectGame) {
            points += tournament.points_perfect_game;
            reasons.push('partida_perfecta');
          }

          // Aplicar multiplicador de cola
          points = Math.round(points * multiplier);

          console.log(`💰 Puntos calculados: ${points} (multiplicador: ${multiplier})`);

          if (points > 0) {
            // Guardar registro de la partida
            const { error: matchError } = await supabase
              .from('match_records')
              .insert({
                tournament_id: tournament.id,
                registration_id: registration.id,
                match_id: matchId,
                queue_type: QUEUE_ID_MAP[matchData.info.queueId] || 'unknown',
                game_start: gameStartTime.toISOString(),
                duration: matchData.info.gameDuration,
                win: player.win,
                kills: player.kills,
                deaths: player.deaths,
                assists: player.assists,
                champion_id: player.championId,
                points_earned: points,
                points_breakdown: { reasons, multiplier }
              });

            if (matchError) {
              console.error('Error guardando partida:', matchError);
              continue;
            }

            // Actualizar puntos totales en la registración
            const { error: updateError } = await supabase
              .from('tournament_registrations')
              .update({
                total_points: registration.total_points + points,
                total_matches: registration.total_matches + 1
              })
              .eq('id', registration.id);

            if (updateError) {
              console.error('Error actualizando puntos:', updateError);
            } else {
              console.log(`✅ Puntos actualizados: ${registration.total_points} → ${registration.total_points + points}`);
              newPoints += points;
            }
          }

          processedMatches++;
        }
      } catch (error) {
        console.error(`Error procesando usuario ${registration.user_id}:`, error);
        continue;
      }
    }
  }

  console.log(`🎉 Proceso completado: ${processedMatches} partidas procesadas, ${newPoints} puntos nuevos`);

  return {
    processedMatches,
    newPoints,
    tournamentsProcessed: activeTournaments?.length || 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const result = await scanMatches();
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error en scan-matches GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await scanMatches();
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error en scan-matches:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}