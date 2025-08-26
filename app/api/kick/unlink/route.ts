import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST() {
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

    // Eliminar la conexión de Kick
    const { error: deleteError } = await supabase
      .from('user_connections')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error al desvincular cuenta de Kick:', deleteError);
      return NextResponse.json(
        { error: 'Error al desvincular la cuenta de Kick' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta de Kick desvinculada exitosamente'
    });

  } catch (error: any) {
    console.error('Error en unlink de Kick:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
