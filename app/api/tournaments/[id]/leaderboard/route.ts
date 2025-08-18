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

    // Obtener registros del torneo
    const { data: registrations, error: registrationsError } = await supabase
      .from('tournament_registrations')
      .select('user_id')
      .eq('tournament_id', tournamentId);

    if (registrationsError) {
      return NextResponse.json(
        { error: 'Error al obtener registros' },
        { status: 500 }
      );
    }

    // Obtener cuentas de Riot de los usuarios registrados
    const { data: riotAccounts, error: riotError } = await supabase
      .from('riot_accounts')
      .select('user_id, game_name, tag_line, platform')
      .in('user_id', registrations.map(r => r.user_id))
      .eq('verified', true);

    if (riotError) {
      return NextResponse.json(
        { error: 'Error al obtener cuentas de Riot' },
        { status: 500 }
      );
    }

    // Obtener puntos y estadísticas (si existen)
    const { data: points } = await supabase
      .from('tournament_points')
      .select('*')
      .eq('tournament_id', tournamentId);

    // Si no hay puntos, usamos un array vacío
    const tournamentPoints = points || [];

    // Procesar y combinar los datos
    const leaderboard: LeaderboardEntry[] = registrations.map((registration: any) => {
      const userPoints = tournamentPoints.filter(p => p.user_id === registration.user_id);
      const riotAccount = riotAccounts?.find(account => account.user_id === registration.user_id);
      
      return {
        user_id: registration.user_id,
        display_name: null, // Ya no usamos display_name
        summoner_name: riotAccount?.game_name || null,
        region: riotAccount?.platform || null,
        matches_played: userPoints.length,
        total_points: userPoints.reduce((sum, p) => sum + (p.points || 0), 0),
        wins: userPoints.filter(p => p.reasons?.includes('victoria')).length,
        losses: userPoints.filter(p => p.reasons?.includes('derrota')).length,
        avg_kda: userPoints.reduce((sum, p) => sum + (p.kda || 0), 0) / (userPoints.length || 1),
        last_match_at: userPoints.length > 0 
          ? userPoints.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0].created_at 
          : null
      };
    });

    // Ordenar por puntos totales
    leaderboard.sort((a, b) => b.total_points - a.total_points);

    return NextResponse.json({
      success: true,
      leaderboard
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al obtener el leaderboard' },
      { status: 500 }
    );
  }
}