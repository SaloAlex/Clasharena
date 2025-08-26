import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    if (!channel) {
      return NextResponse.json({ error: 'Channel parameter is required' }, { status: 400 });
    }

    // Obtener información del canal
    const channelResponse = await fetch(`https://kick.com/api/v1/channels/${channel}`);
    
    if (!channelResponse.ok) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const channelData = await channelResponse.json();

    // Verificar si está en vivo
    const isLive = channelData.livestream && channelData.livestream.is_live;
    const viewerCount = isLive ? channelData.livestream.viewer_count : 0;
    const followers = channelData.followers_count || 0;

    return NextResponse.json({
      is_live: isLive,
      viewer_count: viewerCount,
      channel_name: channelData.user.username,
      display_name: channelData.user.display_name,
      stream_title: isLive ? channelData.livestream.title : null,
      followers_count: followers,
      profile_image: channelData.user.profile_image_url
    });

  } catch (error) {
    console.error('Error checking Kick status:', error);
    return NextResponse.json({ error: 'Failed to check stream status' }, { status: 500 });
  }
}
