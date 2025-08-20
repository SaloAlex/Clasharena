import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const VALID_PLATFORMS = ['LA1', 'LA2', 'NA1', 'BR1'];

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 1) Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Autenticación requerida' }, { status: 401 });
    }

    // 2) Datos de entrada
    const body = await req.json();
    const { gameName, tagLine, platform } = body;

    if (!gameName || !tagLine || !platform) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: 'Plataforma no válida' }, { status: 400 });
    }

    // Verificar si ya tiene una cuenta verificada
    const { data: existingAccount } = await supabase
      .from('riot_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('verified', true)
      .maybeSingle();

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Ya tienes una cuenta de Riot verificada' },
        { status: 400 }
      );
    }

    // 3) Resolver datos de Riot usando el nuevo cliente unificado
    const regional = platform === 'LA1' || platform === 'LA2' || platform === 'NA1' || platform === 'BR1' ? 'americas' : 'europe';
    const url = `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': process.env.RIOT_API_KEY!
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'No se encontró la cuenta de Riot' }, { status: 404 });
    }
    
    const account = await response.json();

    // 4) Guardar/actualizar cuenta con UPSERT por user_id
    const row = {
      user_id: user.id,
      puuid: account.puuid,
      game_name: gameName,
      tag_line: tagLine,
      platform,
      verified: false,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('riot_accounts')
      .upsert(row, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error al guardar cuenta:', upsertError);
      return NextResponse.json({ error: 'No se pudo guardar la cuenta' }, { status: 500 });
    }

    // 5) Crear challenge - usar solo íconos gratuitos (0-28)
    const iconId = Math.floor(Math.random() * 29); // Íconos gratuitos por defecto
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos

    const { error: challengeError } = await supabase
      .from('verification_challenges')
      .insert({
        user_id: user.id,
        icon_id: iconId,
        expires_at: expiresAt,
        completed: false,
      });

    if (challengeError) {
      console.error('Error creando challenge:', challengeError);
      return NextResponse.json({ error: 'No se pudo crear el desafío' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      icon_id: iconId,
      expires_at: expiresAt,
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