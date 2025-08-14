import { NextRequest, NextResponse } from 'next/server';

const TWITCH_CLIENT_ID = 'ihnx3fyrg1ujytxpkzhtvy2jp7e35a';
const TWITCH_CLIENT_SECRET = 'lh75pn8wc547z3p9dk6m3doffm4eyz';

async function getTwitchAccessToken() {
  console.log('🔑 Obteniendo token de Twitch...');
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    {
      method: 'POST',
    }
  );

  const data = await response.json();
  console.log('✅ Token obtenido:', { ...data, access_token: '***' });
  return data.access_token;
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
    console.log('📺 Respuesta de Twitch:', data);
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
