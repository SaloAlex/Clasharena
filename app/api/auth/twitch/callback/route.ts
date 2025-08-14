import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect('/auth?error=No authorization code provided');
    }

    // Intercambiar el código por un token de acceso
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: 'ihnx3fyrg1ujytxpkzhtvy2jp7e35a',
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.NODE_ENV === 'production'
          ? 'https://play2win.vercel.app/api/auth/twitch/callback'
          : 'http://localhost:3000/api/auth/twitch/callback'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Error getting token:', tokenData);
      return NextResponse.redirect('/auth?error=Failed to get access token');
    }

    // Obtener información del usuario
    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Client-Id': 'ihnx3fyrg1ujytxpkzhtvy2jp7e35a'
      }
    });

    const userData = await userResponse.json();
    const user = userData.data[0];

    if (!userResponse.ok || !user) {
      console.error('Error getting user:', userData);
      return NextResponse.redirect('/auth?error=Failed to get user info');
    }

    // Guardar la información en Supabase
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: state, // El state debería ser el user_id de Supabase
        twitch_id: user.id,
        twitch_login: user.login,
        twitch_display_name: user.display_name,
        twitch_profile_image_url: user.profile_image_url,
        twitch_access_token: tokenData.access_token,
        twitch_refresh_token: tokenData.refresh_token,
        twitch_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      });

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.redirect('/auth?error=Failed to update profile');
    }

    // Redirigir al usuario de vuelta a la aplicación
    return NextResponse.redirect('/profile?success=Twitch account linked');

  } catch (error) {
    console.error('Error in Twitch callback:', error);
    return NextResponse.redirect('/auth?error=Internal server error');
  }
}
