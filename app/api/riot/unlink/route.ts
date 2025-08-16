import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // 1. Obtener usuario autenticado
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Autenticación requerida' },
        { status: 401 }
      );
    }

    // 2. Eliminar la cuenta vinculada
    const { error: deleteError } = await supabaseAdmin
      .from('riot_accounts')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error al desvincular cuenta:', deleteError);
      return NextResponse.json(
        { error: 'Error al desvincular la cuenta' },
        { status: 500 }
      );
    }

    // 3. Eliminar desafíos pendientes
    await supabaseAdmin
      .from('verification_challenges')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      message: 'Cuenta desvinculada exitosamente'
    });

  } catch (error: any) {
    console.error('Error en unlink:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}