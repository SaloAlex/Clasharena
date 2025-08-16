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

    // Verificar que el torneo existe
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

    // Verificar que el torneo acepta registros (puede estar upcoming o active)
    const now = new Date();
    const startDate = new Date(tournament.start_at);
    const endDate = new Date(tournament.end_at);
    
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
        { error: 'Debes tener una cuenta de Riot verificada para inscribirte' },
        { status: 400 }
      );
    }

    // Verificar que no está ya registrado
    const { data: existingRegistration } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', session.user.id)
      .single();

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Ya estás inscrito en este torneo' },
        { status: 400 }
      );
    }

    // Crear el registro con la cuenta de Riot vinculada
    const { data: registration, error: registrationError } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: tournamentId,
        user_id: session.user.id,
        riot_account_id: riotAccount.id,
        registered_at: new Date().toISOString()
      })
      .select()
      .single();

    if (registrationError) {
      console.error('Error creating registration:', registrationError);
      return NextResponse.json(
        { error: 'Error al inscribirse en el torneo' },
        { status: 500 }
      );
    }

    // Verificar que el registro se creó correctamente
    const { data: verifyRegistration } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', session.user.id)
      .single();

    console.log('Verify registration:', verifyRegistration);

    return NextResponse.json({
      success: true,
      registration: verifyRegistration,
      message: '¡Inscripción exitosa al torneo!'
    });

  } catch (error) {
    console.error('Error registering for tournament:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

