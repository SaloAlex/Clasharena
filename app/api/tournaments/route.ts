import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      title,
      description,
      format,
      startDate,
      endDate,
      pointsPerWin,
      pointsPerLoss,
      pointsFirstBlood,
      pointsFirstTower,
      pointsPerfectGame,
      minRank,
      maxRank,
      maxGamesPerDay
    } = body;

    // Validaciones básicas
    if (!title || !format || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser futura' },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
        { status: 400 }
      );
    }

    // Crear el torneo
    const { data: tournament, error } = await supabaseAdmin
      .from('tournaments')
      .insert({
        creator_id: user.id,
        title,
        description,
        format,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        points_per_win: pointsPerWin,
        points_per_loss: pointsPerLoss,
        points_first_blood: pointsFirstBlood,
        points_first_tower: pointsFirstTower,
        points_perfect_game: pointsPerfectGame,
        min_rank: minRank || null,
        max_rank: maxRank || null,
        max_games_per_day: maxGamesPerDay || null,
        status: start > now ? 'upcoming' : 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear torneo:', error);
      return NextResponse.json(
        { error: 'Error al crear el torneo' },
        { status: 500 }
      );
    }

    return NextResponse.json(tournament);

  } catch (error: any) {
    console.error('Error in tournaments/create:', error);
    
    if (error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para crear un torneo' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const creatorId = searchParams.get('creator_id');

    let query = supabaseAdmin
      .from('tournaments')
      .select(`
        *,
        creator:creator_id(
          id,
          email
        ),
        participants:tournament_participants(count)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    const { data: tournaments, error } = await query;

    if (error) {
      console.error('Error al obtener torneos:', error);
      return NextResponse.json(
        { error: 'Error al obtener los torneos' },
        { status: 500 }
      );
    }

    return NextResponse.json(tournaments);

  } catch (error: any) {
    console.error('Error in tournaments/list:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
