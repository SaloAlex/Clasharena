import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSummonerByPuuid } from '@/lib/riot';

export async function POST(request: Request) {
  try {
    // 1. Autenticación
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Autenticación requerida' },
        { status: 401 }
      );
    }

    // 2. Obtener cuenta y desafío activo
    const { data: account } = await supabase
      .from('riot_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!account) {
      return NextResponse.json({
        error: 'No se encontró una cuenta de Riot para verificar'
      }, { status: 404 });
    }

    const { data: challenge } = await supabase
      .from('verification_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!challenge) {
      return NextResponse.json({
        error: 'No hay un desafío de verificación activo'
      }, { status: 404 });
    }

    // 3. Verificar el ícono actual del invocador
    console.log('🔍 Verificando ícono para:', {
      puuid: account.puuid,
      platform: account.platform,
      expectedIcon: challenge.icon_id
    });

    const summoner = await getSummonerByPuuid(account.puuid, account.platform);
    const currentIcon = summoner.profileIconId;

    console.log('✅ Ícono actual:', currentIcon);

    if (currentIcon !== challenge.icon_id) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'El ícono de invocador no coincide con el desafío'
      });
    }

    // 4. Marcar como verificado
    const { error: updateError } = await supabase
      .from('riot_accounts')
      .update({
        verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error al actualizar cuenta:', updateError);
      return NextResponse.json({
        error: 'Error al verificar la cuenta'
      }, { status: 500 });
    }

    // 5. Marcar desafío como completado
    await supabase
      .from('verification_challenges')
      .update({ completed: true })
      .eq('id', challenge.id);

    return NextResponse.json({
      success: true,
      verified: true,
      message: '¡Cuenta verificada exitosamente!'
    });

  } catch (error: any) {
    console.error('Error:', error);
    
    if (error.message?.includes('Authentication required')) {
      return NextResponse.json({
        error: 'Debes iniciar sesión para verificar tu cuenta'
      }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
