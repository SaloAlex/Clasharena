import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { RiotAPI } from '@/lib/riot/api';
import { REGIONS } from '@/lib/riot/constants';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    // 2. Obtener y validar datos del request
    const body = await request.json();
    const { gameName, tagLine, platform } = body;

    if (!gameName || !tagLine || !platform) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Validar que la plataforma es válida
    const isValidPlatform = REGIONS.some(region => 
      region.platforms.some(p => p.value === platform)
    );
    
    if (!isValidPlatform) {
      return NextResponse.json(
        { error: 'Plataforma no válida' },
        { status: 400 }
      );
    }

    // 3. Verificar que el usuario no tenga ya una cuenta verificada
    console.log('Verificando cuentas existentes...');
    const { data: existingAccount } = await supabaseAdmin
      .from('riot_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('verified', true)
      .single();

    console.log('Cuenta existente:', existingAccount);
    if (existingAccount) {
      return NextResponse.json(
        { error: 'Ya tienes una cuenta de Riot verificada' },
        { status: 400 }
      );
    }

    // 4. Inicializar API de Riot
    const riotApi = new RiotAPI();

    // 5. Verificar que la cuenta existe
    const account = await riotApi.getAccountByRiotId(gameName, tagLine, platform);
    if (!account) {
      return NextResponse.json(
        { error: 'No se encontró la cuenta de Riot' },
        { status: 404 }
      );
    }

    // 6. Obtener datos del invocador
    const summoner = await riotApi.getSummonerByPuuid(account.puuid, platform);
    if (!summoner) {
      return NextResponse.json(
        { error: 'No se encontró el invocador' },
        { status: 404 }
      );
    }

    // 7. Generar código de desafío (número aleatorio entre 0 y 29 - íconos por defecto)
    const icon_id = Math.floor(Math.random() * 30);
    const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // 8. Guardar el desafío en la base de datos
    const { error: challengeError } = await supabaseAdmin
      .from('verification_challenges')
      .insert({
        user_id: user.id,
        icon_id,
        expires_at,
      });

    if (challengeError) {
      console.error('Error al crear desafío:', challengeError);
      return NextResponse.json(
        { error: 'Error al crear el desafío de verificación' },
        { status: 500 }
      );
    }

    // 9. Guardar o actualizar la cuenta de Riot (sin verificar aún)
    const { error: accountError } = await supabaseAdmin
      .from('riot_accounts')
      .upsert({
        user_id: user.id,
        puuid: account.puuid,
        game_name: gameName,
        tag_line: tagLine,
        platform,
        verified: false,
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (accountError) {
      console.error('Error al guardar cuenta:', accountError);
      return NextResponse.json(
        { error: 'Error al guardar la información de la cuenta' },
        { status: 500 }
      );
    }

    // 10. Devolver información del desafío
    return NextResponse.json({
      success: true,
      icon_id,
      expires_at,
      message: 'Cambia tu ícono de invocador al indicado y luego verifica'
    });

  } catch (error: any) {
    console.error('Error en start-verification:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}