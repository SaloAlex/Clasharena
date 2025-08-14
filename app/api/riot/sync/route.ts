import { NextRequest, NextResponse } from 'next/server';
import { getRecentMatchIds } from '@/lib/riot';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Helper para verificar autenticación usando cookies
async function requireAuth(request: NextRequest) {
  try {
    // Primero intentar obtener el usuario del header establecido por el middleware
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    
    if (userId && userEmail) {
      return { id: userId, email: userEmail };
    }

    // Si no hay headers, intentar con Supabase
    const supabase = supabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('Authentication required');
    }

    return user;
  } catch (error) {
    throw new Error('Authentication required');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);
    
    // Obtener la cuenta verificada del usuario
    console.log('🔍 Buscando cuenta vinculada para:', user.id);
    const { data: linkedAccount, error: accountError } = await supabaseAdmin
      .from('linked_riot_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('verified', true)
      .single();

    console.log('📋 Resultado:', {
      account: linkedAccount,
      error: accountError
    });

    if (accountError || !linkedAccount) {
      return NextResponse.json(
        { error: 'No tienes una cuenta de Riot verificada. Primero vincula y verifica tu cuenta.' },
        { status: 400 }
      );
    }

    // Obtener los últimos 20 match IDs
    const matchIds = await getRecentMatchIds(linkedAccount.puuid, linkedAccount.region, 20);
    
    if (matchIds.length === 0) {
      return NextResponse.json({
        success: true,
        newMatches: 0,
        message: 'No se encontraron partidas recientes.'
      });
    }

    // Obtener los match IDs que ya están sincronizados
    const { data: existingMatches, error: existingError } = await supabaseAdmin
      .from('riot_matches')
      .select('match_id')
      .eq('user_id', user.id)
      .in('match_id', matchIds);

    if (existingError) {
      console.error('Error getting existing matches:', existingError);
      return NextResponse.json(
        { error: 'Error al verificar partidas existentes' },
        { status: 500 }
      );
    }

    console.log('📋 Partidas existentes:', existingMatches);
    
    const existingMatchIds = existingMatches?.map(m => m.match_id) || [];
    const newMatchIds = matchIds.filter(id => !existingMatchIds.includes(id));

    console.log('🔍 Análisis de partidas:', {
      total: matchIds.length,
      existing: existingMatchIds.length,
      new: newMatchIds.length
    });

    if (newMatchIds.length === 0) {
      return NextResponse.json({
        success: true,
        newMatches: 0,
        message: 'Todas las partidas ya están sincronizadas.'
      });
    }

    // Insertar las nuevas partidas
    const matchesToInsert = newMatchIds.map(matchId => ({
      user_id: user.id,
      puuid: linkedAccount.puuid,
      match_id: matchId,
      synced_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabaseAdmin
      .from('riot_matches')
      .insert(matchesToInsert);

    if (insertError) {
      console.error('Error inserting matches:', insertError);
      return NextResponse.json(
        { error: 'Error al guardar las partidas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newMatches: newMatchIds.length,
      message: `Se sincronizaron ${newMatchIds.length} nuevas partidas.`
    });

  } catch (error: any) {
    console.error('Error in riot/sync:', error);
    
    if (error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para sincronizar partidas.' },
        { status: 401 }
      );
    }

    if (error.message.includes('No matches found')) {
      return NextResponse.json(
        { error: 'No se encontraron partidas para sincronizar.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
