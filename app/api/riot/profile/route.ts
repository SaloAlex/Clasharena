import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    // 2. Obtener cuenta de Riot vinculada
    const { data: riotAccount, error: accountError } = await supabase
      .from('riot_accounts')
      .select('game_name, tag_line, platform, verified, puuid')
      .eq('user_id', user.id)
      .maybeSingle();

    if (accountError && accountError.code !== 'PGRST116') {
      console.error('Error al obtener cuenta de Riot:', accountError);
      return NextResponse.json(
        { error: 'Error al obtener la cuenta de Riot' },
        { status: 500 }
      );
    }

    // 3. Devolver la información básica
    return NextResponse.json({
      success: true,
      account: riotAccount || null
    });

  } catch (error: any) {
    console.error('Error en profile:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}