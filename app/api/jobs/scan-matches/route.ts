import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
// TODO: Migrar a nuevo cliente unificado
// import { riotApi } from '@/lib/riot/client';

interface MatchResult {
  win: boolean;
  firstBlood: boolean;
  firstTower: boolean;
  perfectGame: boolean;
  queueId: number;
}

export async function POST(request: NextRequest) {
  try {
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


      // Obtener configuración de colas habilitadas
      const queues = tournament.queues || {};
      const enabledQueueIds = Object.entries(queues)
        .filter(([_, config]: [string, any]) => config.enabled)
        .map(([_, config]: [string, any]) => config.id);

      // Obtener registraciones del torneo
      const { data: registrations, error: registrationsError } = await supabase
        .from('tournament_registrations')
        .select('user_id, created_at')
        .eq('tournament_id', tournament.id);

      if (registrationsError) {
        console.error(`Error obteniendo registraciones para torneo ${tournament.id}:`, registrationsError);
        continue;
      }

      // Obtener cuentas de Riot para estos usuarios
      if (registrations && registrations.length > 0) {
        const { data: riotAccounts, error: riotError } = await supabase
          .from('riot_accounts')
          .select('user_id, puuid, platform')
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
          if (!riotAccount?.puuid) continue;

        try {
          // Obtener última partida procesada
          const { data: lastMatch } = await supabase
            .from('match_records')
            .select('game_start')
            .eq('puuid', riotAccount.puuid)
            .order('game_start', { ascending: false })
            .limit(1)
            .single();

          // TODO: Migrar a nuevo cliente unificado
          // Configurar región
          // riotApi.setPlatform(riotAccount.platform);

          // Obtener partidas recientes
          // const matchIds = await riotApi.getMatchIds({
          //   puuid: riotAccount.puuid,
          //   startTime: lastMatch 
          //     ? Math.floor(new Date(lastMatch.game_start).getTime() / 1000)
          //     : Math.floor(new Date(registration.created_at).getTime() / 1000),
          //   endTime: Math.floor(new Date(tournament.end_at).getTime() / 1000),
          //   count: 20,
          // });
          
          // Temporalmente saltar este usuario hasta migrar
          continue;

          // TODO: Migrar a nuevo cliente unificado - código temporalmente comentado
          /*
          for (const matchId of matchIds) {
            // Verificar si ya procesamos esta partida
            const { data: existingMatch } = await supabase
              .from('match_records')
              .select('id')
              .eq('match_id', matchId)
              .single();

            if (existingMatch) continue;

            // TODO: Migrar a nuevo cliente unificado
            // Obtener detalles de la partida
            // const matchData = await riotApi.getMatch(matchId);
            
            // Encontrar al jugador en la partida
            const player = matchData.info.participants.find(
              (p: any) => p.puuid === riotAccount.puuid
            );

            if (!player) continue;

            // Verificar si la cola está habilitada
            if (!enabledQueueIds.includes(matchData.info.queueId)) {
              continue;
            }

            // Verificar si la partida está dentro del periodo del torneo
            const gameStartTime = new Date(matchData.info.gameStartTimestamp);
            if (gameStartTime < new Date(registration.created_at) || 
                gameStartTime > new Date(tournament.end_at)) {
              continue;
            }

            // Guardar registro de la partida
            const { error: matchError } = await supabase
              .from('match_records')
              .insert({
                match_id: matchId,
                puuid: riotAccount.puuid,
                platform: riotAccount.platform,
                queue_id: matchData.info.queueId,
                game_start: gameStartTime.toISOString(),
                duration_sec: matchData.info.gameDuration,
                win: player.win,
                kills: player.kills,
                deaths: player.deaths,
                assists: player.assists,
                champion_id: player.championId,
              });

            if (matchError) throw matchError;

            // Encontrar el multiplicador para esta cola
            const queueConfig = Object.values(queues).find((q: any) => q.id === matchData.info.queueId);
            const multiplier = queueConfig?.pointMultiplier || 1;

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

            if (points > 0) {
              // Guardar puntos
              const { error: pointsError } = await supabase
                .from('tournament_points')
                .insert({
                  tournament_id: tournament.id,
                  user_id: registration.user_id,
                  match_id: matchId,
                  points,
                  reasons,
                });

              if (pointsError) throw pointsError;

              newPoints += points;
            }

            processedMatches++;
          }
          */
        } catch (error) {
          console.error(`Error procesando usuario ${registration.user_id}:`, error);
          continue;
        }
      }
    }
    }

    return NextResponse.json({
      success: true,
      processedMatches,
      newPoints,
      tournamentsProcessed: activeTournaments?.length || 0,
    });

  } catch (error) {
    console.error('Error en scan-matches:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}