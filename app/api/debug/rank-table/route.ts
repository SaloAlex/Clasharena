import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si la tabla existe
    const { data: tableInfo, error: tableError } = await supabase
      .from('player_ranks')
      .select('*')
      .limit(1);

    if (tableError) {
      return NextResponse.json({
        error: 'Error accediendo a la tabla',
        detail: tableError.message,
        code: tableError.code
      }, { status: 500 });
    }

    // Obtener datos del usuario
    const { data: userRanks, error: userError } = await supabase
      .from('player_ranks')
      .select('*')
      .eq('user_id', user.id);

    if (userError) {
      return NextResponse.json({
        error: 'Error obteniendo datos del usuario',
        detail: userError.message
      }, { status: 500 });
    }

    // Obtener cuenta de Riot del usuario
    const { data: riotAccount, error: riotError } = await supabase
      .from('riot_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      tableExists: true,
      userRanks: userRanks || [],
      riotAccount: riotAccount || null,
      userId: user.id
    });

  } catch (error: any) {
    console.error('Error en debug rank table:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      detail: error.message 
    }, { status: 500 });
  }
}

