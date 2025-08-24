import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registration_id');

    if (!registrationId) {
      return NextResponse.json(
        { error: 'registration_id es requerido' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Obtener las partidas del usuario en este torneo
    const { data: matches, error } = await supabase
      .from('match_records')
      .select('*')
      .eq('registration_id', registrationId)
      .order('game_start', { ascending: false });

    if (error) {
      console.error('Error obteniendo partidas:', error);
      return NextResponse.json(
        { error: 'Error al obtener las partidas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      matches: matches || []
    });

  } catch (error) {
    console.error('Error en matches endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

