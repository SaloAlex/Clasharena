import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getRecentMatchIds, getMatchDetails, toRegionalFromPlatform } from '@/lib/riot';

// Cliente admin para bypass RLS (solo después de validar permisos)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

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

// Función para escanear partidas de un torneo específico
async function scanTournamentMatches(tournamentId: string) {
  const supabase = createRouteHandlerClient({ cookies });

  // 1) Auth + validación de dueño del torneo
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No autenticado');
  }

  // Obtener el torneo específico
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (tournamentError || !tournament) {
    throw new Error('Torneo no encontrado');
  }

  // Verificar que el usuario es el creador del torneo
  if (tournament.creator_id !== user.id) {
    throw new Error('No tienes permisos para escanear este torneo');
  }

  // Obtener configuración de colas habilitadas
  const queues = tournament.queues || {};
  
  const enabledQueueIds = Object.entries(queues)
    .filter(([_, config]: [string, any]) => config.enabled)
    .map(([_, config]: [string, any]) => config.id);

  // Obtener registraciones del torneo
  const { data: registrations, error: registrationsError } = await supabase
    .from('tournament_registrations')
    .select('*')
    .eq('tournament_id', tournamentId);

  if (registrationsError) {
    throw new Error(`Error obteniendo registraciones: ${registrationsError.message}`);
  }

  if (!registrations || registrations.length === 0) {
    return { processedMatches: 0, newPoints: 0 };
  }

  // Obtener cuentas de Riot para estos usuarios
  const { data: riotAccounts, error: riotError } = await supabase
    .from('riot_accounts')
    .select('*')
    .in('user_id', registrations.map(r => r.user_id))
    .eq('verified', true);

  if (riotError) {
    throw new Error(`Error obteniendo cuentas de Riot: ${riotError.message}`);
  }

  // Combinar datos
  const registrationsWithAccounts = registrations.map(registration => ({
    ...registration,
    riot_account: riotAccounts?.find(account => account.user_id === registration.user_id)
  }));

  let processedMatches = 0;
  let newPoints = 0;
  
  // Acumulador para actualización atómica de puntos
  const pointsAccumulator: Record<string, { points: number; matches: number }> = {};

  for (const registration of registrationsWithAccounts) {
    const riotAccount = registration.riot_account;
    if (!riotAccount?.puuid) {
      continue;
    }

    try {
      // Obtener partidas recientes
      const matchIds = await getRecentMatchIds(riotAccount.puuid, riotAccount.region);

      for (const matchId of matchIds) {
        // Verificar si ya procesamos esta partida
        const { data: existingMatch } = await supabaseAdmin
          .from('match_records')
          .select('id')
          .eq('match_id', matchId)
          .eq('registration_id', registration.id)
          .single();

        if (existingMatch) {
          continue;
        }

        // Obtener detalles de la partida
        const matchData = await getMatchDetails(matchId, riotAccount.region);
        if (!matchData) {
          continue;
        }

        // Encontrar al jugador en la partida
        const player = matchData.info.participants.find(
          (p: any) => p.puuid === riotAccount.puuid
        );

        if (!player) {
          continue;
        }

        // Verificar si la cola está habilitada
        if (!enabledQueueIds.includes(matchData.info.queueId)) {
          continue;
        }

        // Verificar que la partida sea dentro del período del torneo
        const gameStartTime = new Date(matchData.info.gameCreation);
        const tournamentStart = new Date(tournament.start_at);
        const tournamentEnd = new Date(tournament.end_at);
        
        if (gameStartTime < tournamentStart || gameStartTime > tournamentEnd) {
          continue;
        }

        // Calcular puntos
        const kda = player.deaths > 0 ? (player.kills + player.assists) / player.deaths : player.kills + player.assists;
        
        // Normalización de puntos (camelCase vs snake_case)
        const baseWin = Number(tournament.points_per_win ?? tournament.pointsPerWin ?? 0);
        const baseLoss = Number(tournament.points_per_loss ?? tournament.pointsPerLoss ?? 0);
        const pFirstBlood = Number(tournament.points_first_blood ?? tournament.pointsFirstBlood ?? 0);
        const pFirstTower = Number(tournament.points_first_tower ?? tournament.pointsFirstTower ?? 0);
        const pPerfectGame = Number(tournament.points_perfect_game ?? tournament.pointsPerfectGame ?? 0);

        // Multiplicador por cola (si está configurado)
        const qCfg = Object.values(queues ?? {}).find((q: any) => (q as any)?.id === matchData.info.queueId);
        const queueMult = Number((qCfg as any)?.pointMultiplier ?? 1);

        // Cálculo de puntos
        let points = player.win ? baseWin : baseLoss;
        const reasons: string[] = [];
        
        if (player.win) {
          reasons.push('WIN');
        } else if (baseLoss > 0) {
          reasons.push('LOSS');
        }

        // Bonus especiales
        if (player.firstBloodKill && pFirstBlood > 0) {
          points += pFirstBlood;
          reasons.push('FIRST_BLOOD');
        }

        if (player.firstTowerKill && pFirstTower > 0) {
          points += pFirstTower;
          reasons.push('FIRST_TOWER');
        }

        if (player.deaths === 0 && pPerfectGame > 0) {
          points += pPerfectGame;
          reasons.push('PERFECT_GAME');
        }

        // Aplicar multiplicador de cola
        points = Math.round(points * queueMult);

        if (points > 0) {
          // Guardar registro de la partida
          const { error: matchError } = await supabaseAdmin
            .from('match_records')
            .insert({
              tournament_id: tournamentId,
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
              points_breakdown: { reasons, multiplier: queueMult }
            });

          if (matchError) {
            console.error('Error guardando partida:', matchError);
            continue;
          }

          // Acumular puntos para actualización atómica
          pointsAccumulator[registration.id] = pointsAccumulator[registration.id] ?? { points: 0, matches: 0 };
          pointsAccumulator[registration.id].points += points;
          pointsAccumulator[registration.id].matches += 1;
          
          newPoints += points;
        }

        processedMatches++;
      }
    } catch (error) {
      console.error(`Error procesando usuario ${registration.user_id}:`, error);
      continue;
    }
  }

  // Actualización atómica de puntos totales
  for (const [registrationId, accumulator] of Object.entries(pointsAccumulator)) {
    try {
      // Obtener valores actuales para actualización segura
      const { data: currentRegistration } = await supabaseAdmin
        .from('tournament_registrations')
        .select('total_points, total_matches')
        .eq('id', registrationId)
        .single();

      const currentPoints = currentRegistration?.total_points ?? 0;
      const currentMatches = currentRegistration?.total_matches ?? 0;

      const { error: updateError } = await supabaseAdmin
        .from('tournament_registrations')
        .update({
          total_points: currentPoints + accumulator.points,
          total_matches: currentMatches + accumulator.matches
        })
        .eq('id', registrationId);

      if (updateError) {
        console.error(`Error actualizando puntos para registro ${registrationId}:`, updateError);
      }
    } catch (error) {
      console.error(`Error en actualización atómica para registro ${registrationId}:`, error);
    }
  }



  return {
    processedMatches,
    newPoints,
    tournamentTitle: tournament.title,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await scanTournamentMatches(params.id);
    
    return NextResponse.json({
      success: true,
      message: `Escaneo completado: ${result.processedMatches} partidas procesadas, ${result.newPoints} puntos nuevos`,
      ...result
    });
  } catch (error: any) {
    console.error('Error en scan de torneo:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
