import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Autenticación requerida' },
        { status: 401 }
      );
    }

    // Obtener información de Kick del usuario
    const { data: kickConnection, error: kickError } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (kickError && kickError.code !== 'PGRST116') {
      console.error('Error al obtener conexión de Kick:', kickError);
      return NextResponse.json(
        { error: 'Error al obtener información de Kick' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      kickAccount: kickConnection || null
    });

  } catch (error: any) {
    console.error('Error en perfil de Kick:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
