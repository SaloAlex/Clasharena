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
    console.log('=== INICIO POST TOURNAMENTS ===');
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    console.log('Verificando autenticación...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Error de autenticación:', authError);
      return NextResponse.json('Error de autenticación', { status: 401 });
    }
    if (!session) {
      console.error('No hay sesión');
      return NextResponse.json('No autorizado', { status: 401 });
    }
    console.log('Usuario autenticado:', session.user.id);

    const formData = await req.json();
    console.log('Datos recibidos:', JSON.stringify(formData, null, 2));

    // Validar campos básicos
    if (!formData.title || formData.title.trim().length < 3) {
      console.error('Título inválido');
      return NextResponse.json('Título debe tener al menos 3 caracteres', { status: 400 });
    }

    if (!formData.description || formData.description.trim().length < 10) {
      console.error('Descripción inválida');
      return NextResponse.json('Descripción debe tener al menos 10 caracteres', { status: 400 });
    }

    // Validar fechas
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate <= startDate) {
      console.error('Fechas inválidas');
      return NextResponse.json('La fecha de fin debe ser posterior a la de inicio', { status: 400 });
    }

    // Obtener colas habilitadas como array de enteros
    const enabledQueueIds = Object.entries(formData.queues || {})
      .filter(([_, config]: [string, any]) => config.enabled)
      .map(([_, config]: [string, any]) => config.id);

    console.log('Colas habilitadas:', enabledQueueIds);

    if (enabledQueueIds.length === 0) {
      console.error('No hay colas habilitadas');
      return NextResponse.json('Debes habilitar al menos una cola', { status: 400 });
    }

    // Preparar scoring_json con toda la configuración avanzada
    const scoringJson = {
      queueConfigs: formData.queues, // Configuración completa de colas
      customRules: formData.customRules || '',
      prizes: formData.prizes || { first: '', second: '', third: '' }
    };

    // Preparar datos para insertar según la estructura real de la tabla
    const tournamentData = {
      creator_id: session.user.id,
      title: formData.title.trim(),
      description: formData.description.trim(),
      format: formData.format || 'duration',
      status: 'upcoming',
      start_at: formData.startDate,  // Usar start_at
      end_at: formData.endDate,      // Usar end_at
      queues: formData.queues,       // JSONB con toda la configuración
      points_per_win: parseInt(formData.pointsPerWin) || 3,
      points_per_loss: parseInt(formData.pointsPerLoss) || 0,
      points_first_blood: parseInt(formData.pointsFirstBlood) || 0,
      points_first_tower: parseInt(formData.pointsFirstTower) || 0,
      points_perfect_game: parseInt(formData.pointsPerfectGame) || 0,
      min_rank: formData.minRank || null,
      max_rank: formData.maxRank || null,
      max_games_per_day: parseInt(formData.maxGamesPerDay) || null,
      scoring_json: scoringJson,
      custom_rules: formData.customRules || '',
      prizes: formData.prizes || { first: '', second: '', third: '' },
      allowed_queues: formData.queues, // Duplicar en allowed_queues también
      allowed_champions: [],           // Array vacío por defecto
      banned_champions: []             // Array vacío por defecto
    };

    console.log('Datos a insertar:', JSON.stringify(tournamentData, null, 2));

    // Insertar en la base de datos
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert(tournamentData)
      .select()
      .single();

    if (error) {
      console.error('Error al insertar en BD:', error);
      return NextResponse.json(`Error de base de datos: ${error.message}`, { status: 500 });
    }

    console.log('Torneo creado exitosamente:', tournament.id);
    return NextResponse.json(tournament);

  } catch (error: any) {
    console.error('Error inesperado:', error);
    return NextResponse.json(`Error interno: ${error.message}`, { status: 500 });
  }
}