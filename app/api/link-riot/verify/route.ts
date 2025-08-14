import { NextRequest, NextResponse } from 'next/server';
import { getSummonerByPuuid } from '@/lib/riot';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth();
    
    // Obtener el desafío vigente del usuario
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('riot_verification_challenges')
      .select('*')
      .eq('userId', user.id)
      .eq('consumed', false)
      .gt('expiresAt', new Date().toISOString())
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { 
          verified: false, 
          reason: 'No hay un desafío vigente. Genera uno nuevo.' 
        },
        { status: 400 }
      );
    }

    // Obtener la cuenta vinculada para obtener la plataforma
    const { data: linkedAccount, error: accountError } = await supabaseAdmin
      .from('linked_riot_accounts')
      .select('platform')
      .eq('userId', user.id)
      .eq('puuid', challenge.puuid)
      .single();

    if (accountError || !linkedAccount) {
      return NextResponse.json(
        { 
          verified: false, 
          reason: 'Cuenta vinculada no encontrada.' 
        },
        { status: 400 }
      );
    }

    // Obtener información del summoner para verificar el ícono
    const summoner = await getSummonerByPuuid(challenge.puuid, linkedAccount.platform);
    
    // Verificar si el ícono coincide
    if (summoner.profileIconId === challenge.expectedIconId) {
      // Marcar el desafío como consumido
      await supabaseAdmin
        .from('riot_verification_challenges')
        .update({ consumed: true })
        .eq('id', challenge.id);

      // Marcar la cuenta como verificada
      await supabaseAdmin
        .from('linked_riot_accounts')
        .update({ verified: true })
        .eq('userId', user.id)
        .eq('puuid', challenge.puuid);

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
