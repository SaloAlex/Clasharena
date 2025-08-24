import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RiotAccount {
  game_name: string | null;
  tag_line: string | null;
  platform: string | null;
}

interface User {
  display_name: string | null;
  riot_accounts: RiotAccount[];
}

interface Registration {
  user_id: string;
  users: User | null;
}

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  summoner_name: string | null;
  region: string | null;
  matches_played: number;
  total_points: number;
  wins: number;
  losses: number;
  avg_kda: number;
  last_match_at: string | null;
}

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const tournamentId = params.id;

    // Verificar que el torneo existe
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }

    // Obtener registraciones del torneo
    const { data: registrations, error: registrationsError } = await supabase
      .from('tournament_registrations')
      .select(`
        user_id,
        summoner_name,
        total_points,
        total_matches,
        match_records(
          win,
          kills,
          deaths,
          assists,
          game_start
        )
      `)
      .eq('tournament_id', tournamentId);

    if (registrationsError) {
      console.error('Error obteniendo registraciones:', registrationsError);
      return NextResponse.json(
        { error: 'Error al obtener registraciones' },
        { status: 500 }
      );
    }

    // Obtener cuentas de Riot por separado
    const userIds = registrations?.map(r => r.user_id) || [];
    const { data: riotAccounts, error: riotError } = await supabase
      .from('riot_accounts')
      .select('user_id, platform')
      .in('user_id', userIds)
      .eq('verified', true);

    if (riotError) {
      console.error('Error obteniendo cuentas de Riot:', riotError);
      return NextResponse.json(
        { error: 'Error al obtener cuentas de Riot' },
        { status: 500 }
      );
    }

    // Procesar los datos para el formato esperado
    const leaderboard: LeaderboardEntry[] = (registrations || []).map((registration: any) => {
      const matches = registration.match_records || [];
      const wins = matches.filter((m: any) => m.win).length;
      const losses = matches.filter((m: any) => !m.win).length;
      
      // Calcular KDA promedio
      const totalKills = matches.reduce((sum: number, m: any) => sum + (m.kills || 0), 0);
      const totalDeaths = matches.reduce((sum: number, m: any) => sum + (m.deaths || 0), 0);
      const totalAssists = matches.reduce((sum: number, m: any) => sum + (m.assists || 0), 0);
      
      const avgKda = totalDeaths > 0 
        ? (totalKills + totalAssists) / totalDeaths 
        : totalKills + totalAssists;

      // Obtener fecha de la última partida
      const lastMatch = matches.length > 0 
        ? matches.sort((a: any, b: any) => 
            new Date(b.game_start).getTime() - new Date(a.game_start).getTime()
          )[0]
        : null;

      // Buscar la cuenta de Riot correspondiente
      const riotAccount = riotAccounts?.find(account => account.user_id === registration.user_id);

      return {
        user_id: registration.user_id,
        display_name: null,
        summoner_name: registration.summoner_name,
        region: riotAccount?.platform || null,
        matches_played: registration.total_matches || 0,
        total_points: registration.total_points || 0,
        wins,
        losses,
        avg_kda: avgKda,
        last_match_at: lastMatch?.game_start || null
      };
    });

    // Ordenar por puntos totales (descendente)
    leaderboard.sort((a, b) => b.total_points - a.total_points);

    return NextResponse.json({
      success: true,
      leaderboard
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error: any) {
    console.error('Error en leaderboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener el leaderboard' },
      { status: 500 }
    );
  }
}