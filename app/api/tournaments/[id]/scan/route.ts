import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { riotApi } from '@/lib/riot/client';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const tournamentId = params.id;

    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener datos del torneo y sus participantes
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_registrations (
          user_id,
          registered_at,
          riot_account:riot_accounts!riot_account_id(
            puuid,
            platform
          )
        )
      `)
      .eq('id', tournamentId)
      .single();

    if (tournamentError) {
      console.error('Error obteniendo torneo:', tournamentError);
      return NextResponse.json({ error: 'Error al obtener torneo' }, { status: 500 });
    }

    let processedMatches = 0;
    let newPoints = 0;

    // Obtener configuración de colas habilitadas
    const queues = tournament.queues || {};
    const enabledQueueIds = Object.entries(queues)
      .filter(([_, config]: [string, any]) => config.enabled)
      .map(([_, config]: [string, any]) => config.id);

    // Procesar cada participante
    for (const registration of tournament.tournament_registrations) {
      const riotAccount = registration.riot_accounts?.[0];
      if (!riotAccount?.puuid) continue;

      try {
        // Obtener última partida procesada y partidas ya registradas en una sola consulta
        const { data: existingMatches } = await supabase
          .from('match_records')
          .select('match_id, game_start')
          .eq('puuid', riotAccount.puuid)
          .order('game_start', { ascending: false });

        const lastMatch = existingMatches?.[0];
        const processedMatchIds = new Set(existingMatches?.map(m => m.match_id) || []);

        // Configurar región
        riotApi.setRouting(riotAccount.platform);

        // Obtener partidas recientes (últimas 10 para ser más eficientes)
        const matchIds = await riotApi.getMatchIds({
          puuid: riotAccount.puuid,
          startTime: lastMatch 
            ? Math.floor(new Date(lastMatch.game_start).getTime() / 1000)
            : Math.floor(new Date(registration.registered_at).getTime() / 1000),
          endTime: Math.floor(new Date().getTime() / 1000),
          count: 10,
        });

        // Filtrar partidas ya procesadas usando el Set
        const newMatchIds = matchIds.filter(matchId => !processedMatchIds.has(matchId));

        // Obtener detalles de todas las partidas nuevas en paralelo
        const matchDetailsPromises = newMatchIds.map(matchId => riotApi.getMatch(matchId));
        const matchesData = await Promise.all(matchDetailsPromises);

        for (let i = 0; i < newMatchIds.length; i++) {
          const matchId = newMatchIds[i];
          const matchData = matchesData[i];
          
          // Encontrar al jugador en la partida
          const player = matchData.info.participants.find(
            (p: any) => p.puuid === riotAccount.puuid
          );

          if (!player) continue;

          // Verificar si la cola está habilitada
          if (!enabledQueueIds.includes(matchData.info.queueId)) {
            console.log(`Cola ${matchData.info.queueId} no habilitada para este torneo`);
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
              game_start: new Date(matchData.info.gameStartTimestamp).toISOString(),
              duration_sec: matchData.info.gameDuration,
              win: player.win,
              kills: player.kills,
              deaths: player.deaths,
              assists: player.assists,
              champion_id: player.championId,
            });

          if (matchError) {
            console.error('Error guardando partida:', matchError);
            continue;
          }

          // Encontrar el multiplicador para esta cola
          const queueConfig = Object.values(queues).find((q: any) => q.id === matchData.info.queueId);
          const multiplier = queueConfig?.pointMultiplier || 1;

          // Calcular puntos
          let points = 0;
          const reasons: string[] = [];

          if (player.win) {
            points += tournament.points_per_win;
            reasons.push('victoria');
          } else {
            points += tournament.points_per_loss;
            reasons.push('derrota');
          }

          if (player.firstBloodKill || player.firstBloodAssist) {
            points += tournament.points_first_blood;
            reasons.push('primera_sangre');
          }

          if (player.firstTowerKill || player.firstTowerAssist) {
            points += tournament.points_first_tower;
            reasons.push('primera_torre');
          }

          if (player.deaths === 0 && player.assists > 0) {
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

            if (pointsError) {
              console.error('Error guardando puntos:', pointsError);
              continue;
            }

            newPoints += points;
          }

          processedMatches++;
        }

      } catch (error) {
        console.error(`Error procesando jugador ${registration.user_id}:`, error);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      processedMatches,
      newPoints,
    });

  } catch (error) {
    console.error('Error en scan:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
