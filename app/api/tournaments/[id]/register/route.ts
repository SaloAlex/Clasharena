import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';


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
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el torneo existe y obtener sus restricciones
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el torneo acepta registros
    const now = new Date();
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    
    if (tournament.status === 'finished' || tournament.status === 'cancelled') {
      return NextResponse.json(
        { error: 'El torneo no acepta más inscripciones' },
        { status: 400 }
      );
    }

    if (now > endDate) {
      return NextResponse.json(
        { error: 'El torneo ya ha finalizado' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tiene una cuenta de Riot vinculada y verificada
    const { data: riotAccount, error: riotError } = await supabase
      .from('riot_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('verified', true)
      .single();

    if (riotError || !riotAccount) {
      return NextResponse.json(
        { error: 'Necesitas vincular y verificar tu cuenta de Riot primero' },
        { status: 400 }
      );
    }

    // Se removió temporalmente la verificación de rango

    // Verificar si ya está registrado
    const { data: existingRegistration, error: regError } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', session.user.id)
      .single();

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Ya estás registrado en este torneo' },
        { status: 400 }
      );
    }

    // Crear el registro
    const { data: registration, error: createError } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: tournamentId,
        user_id: session.user.id,
        riot_account_id: riotAccount.id
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creando registro:', createError);
      return NextResponse.json(
        { error: 'Error al registrarte en el torneo' },
        { status: 500 }
      );
    }

    // Registrar en el historial de actividad
    await supabase
      .from('tournament_activity')
      .insert({
        tournament_id: tournamentId,
        user_id: session.user.id,
        action: 'REGISTERED',
        details: {
          riot_account: {
            game_name: riotAccount.game_name,
            tag_line: riotAccount.tag_line,
            platform: riotAccount.platform
          }
        }
      });

    return NextResponse.json({
      success: true,
      registration,
      message: 'Registro exitoso'
    });

  } catch (error: any) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: error.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}