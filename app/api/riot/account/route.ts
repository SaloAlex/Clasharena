import { NextResponse } from 'next/server';
import { requireAuthRoute } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const user = await requireAuthRoute();

    const { data: account, error } = await supabaseAdmin
      .from('riot_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignorar error cuando no se encuentra registro
      console.error('Error al obtener cuenta:', error);
      return NextResponse.json({
        error: 'Error al obtener la información de la cuenta'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      account: account || null
    });

  } catch (error: any) {
    console.error('Error:', error);
    
    if (error.message?.includes('Authentication required')) {
      return NextResponse.json({
        error: 'Debes iniciar sesión para acceder a esta información'
      }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}