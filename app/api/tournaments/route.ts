import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[TOURNAMENTS_GET]', error);
      return new NextResponse("Error al obtener torneos", { status: 500 });
    }

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('[TOURNAMENTS_GET]', error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
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
      maxGamesPerDay,
    } = body;

    if (!title) {
      return new NextResponse("El título es requerido", { status: 400 });
    }

    // Validar fechas
    if (new Date(endDate) <= new Date(startDate)) {
      return new NextResponse("La fecha de fin debe ser posterior a la fecha de inicio", { status: 400 });
    }

    console.log('Creating tournament with user:', session.user);
    
    // Crear el torneo en Supabase
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert([{
        creator_id: session.user.id, // Asegurarnos de que este es el ID correcto
        title,
        description,
        format,
        status: 'upcoming', // Los torneos comienzan en estado 'upcoming'
        start_date: startDate,
        end_date: endDate,
        points_per_win: pointsPerWin,
        points_per_loss: pointsPerLoss,
        points_first_blood: pointsFirstBlood,
        points_first_tower: pointsFirstTower,
        points_perfect_game: pointsPerfectGame,
        min_rank: minRank,
        max_rank: maxRank,
        max_games_per_day: maxGamesPerDay
      }])
      .select()
      .single();

    if (error) {
      console.error('[TOURNAMENTS_POST]', error);
      return new NextResponse(error.message, { status: 500 });
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('[TOURNAMENTS_POST]', error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}