import { NextRequest, NextResponse } from 'next/server';

const TWITCH_CLIENT_ID = 'ihnx3fyrg1ujytxpkzhtvy2jp7e35a';
const TWITCH_CLIENT_SECRET = 'lh75pn8wc547z3p9dk6m3doffm4eyz';

// Cache del token
let tokenCache = {
  accessToken: '',
  expiresAt: 0
};

async function getTwitchAccessToken() {
  const now = Date.now();
  
  // Si el token existe y no ha expirado, usarlo
  if (tokenCache.accessToken && tokenCache.expiresAt > now) {
    return tokenCache.accessToken;
  }

  // Si no hay token o expiró, obtener uno nuevo
  console.log('🔑 Obteniendo nuevo token de Twitch...');
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    {
      method: 'POST',
    }
  );

  const data = await response.json();
  
  // Guardar el token en caché
  tokenCache = {
    accessToken: data.access_token,
    // Convertir expires_in (segundos) a timestamp y restar 1 hora por seguridad
    expiresAt: now + (data.expires_in * 1000) - (3600 * 1000)
  };

  console.log('✅ Nuevo token obtenido y cacheado');
  return tokenCache.accessToken;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel parameter is required' },
        { status: 400 }
      );
    }

    const accessToken = await getTwitchAccessToken();

    // Obtener información del stream
    const response = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${channel}`,
      {
        headers: {
          'Client-ID': TWITCH_CLIENT_ID!,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    const stream = data.data[0];

    return NextResponse.json({
      isLive: !!stream,
      viewers: stream?.viewer_count || 0,
      title: stream?.title || '',
      gameName: stream?.game_name || '',
    });

  } catch (error: any) {
    console.error('❌ Error checking Twitch status:', {
      error: error.message,
      stack: error.stack,
      response: error.response
    });
    return NextResponse.json(
      { error: 'Error al verificar estado del stream', details: error.message },
      { status: 500 }
    );
  }
}