import { NextRequest, NextResponse } from 'next/server';
import { getSummonerByPuuid } from '@/lib/riot';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth();
    
    console.log('🔍 Buscando desafío vigente para:', { userId: user.id });
    
    const now = new Date().toISOString();
    console.log('⏰ Tiempo actual:', now);
    
    // Obtener el desafío vigente del usuario
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('riot_verification_challenges')
      .select('*')
      .eq('user_id', user.id) // Corregido: userId -> user_id
      .eq('consumed', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('📋 Resultado de búsqueda:', {
      challenge,
      error: challengeError,
      conditions: {
        user_id: user.id,
        consumed: false,
        expires_at_gt: now
      }
    });

    if (challengeError || !challenge) {
      return NextResponse.json(
        { 
          verified: false, 
          reason: 'No hay un desafío vigente. Genera uno nuevo.' 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando cuenta vinculada:', {
      userId: user.id,
      puuid: challenge.puuid
    });

    // Obtener la cuenta vinculada para obtener la plataforma
    const { data: linkedAccount, error: accountError } = await supabaseAdmin
      .from('linked_riot_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('puuid', challenge.puuid)
      .single();

    console.log('📋 Resultado de búsqueda de cuenta:', {
      account: linkedAccount,
      error: accountError
    });

    if (accountError || !linkedAccount) {
      return NextResponse.json(
        { 
          verified: false, 
          reason: 'Cuenta vinculada no encontrada.' 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Verificando desafío:', {
      puuid: challenge.puuid,
      platform: linkedAccount.platform,
      expectedIconId: challenge.expectedIconId
    });

    // Obtener información del summoner para verificar el ícono
    const summoner = await getSummonerByPuuid(challenge.puuid, linkedAccount.platform);
    
    console.log('🔍 Detalles del desafío:', {
      challenge_id: challenge.id,
      expected_icon_id: challenge.expected_icon_id, // Nota: usando snake_case
      expires_at: challenge.expires_at,
      consumed: challenge.consumed
    });
    
    console.log('✅ Información del invocador:', {
      name: summoner.name,
      currentIconId: summoner.profileIconId,
      expectedIconId: challenge.expected_icon_id, // Corregido: expectedIconId -> expected_icon_id
      matches: summoner.profileIconId === challenge.expected_icon_id // Corregido aquí también
    });
    
    // Verificar si el ícono coincide
    if (summoner.profileIconId === challenge.expected_icon_id) { // Corregido aquí también
      // Marcar el desafío como consumido
      await supabaseAdmin
        .from('riot_verification_challenges')
        .update({ consumed: true })
        .eq('id', challenge.id);

      // Marcar la cuenta como verificada
      console.log('✅ Marcando cuenta como verificada:', {
        user_id: user.id,
        puuid: challenge.puuid
      });

      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('linked_riot_accounts')
        .update({ 
          verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('puuid', challenge.puuid)
        .select()
        .single();

      console.log('📋 Resultado de actualización:', {
        data: updateData,
        error: updateError
      });

      if (updateError) {
        console.error('❌ Error al marcar cuenta como verificada:', updateError);
        throw new Error('Error al marcar la cuenta como verificada');
      }

      return NextResponse.json({
        verified: true,
        message: '¡Cuenta verificada exitosamente!'
      });
    } else {
      return NextResponse.json({
        verified: false,
        reason: `El ícono actual (${summoner.profileIconId}) no coincide con el esperado (${challenge.expectedIconId}). Asegúrate de haber cambiado tu ícono de invocador.`
      });
    }

  } catch (error: any) {
    console.error('Error in link-riot/verify:', error);
    
    if (error.message.includes('Authentication required')) {
      return NextResponse.json(
        { 
          verified: false, 
          reason: 'Debes iniciar sesión para verificar tu cuenta Riot.' 
        },
        { status: 401 }
      );
    }

    if (error.message.includes('Summoner not found')) {
      return NextResponse.json(
        { 
          verified: false, 
          reason: 'No se pudo encontrar la información del invocador.' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        verified: false, 
        reason: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
