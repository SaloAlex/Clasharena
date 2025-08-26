import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const jar = cookies();
  const supabase = createRouteHandlerClient({ cookies });

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const expectState = jar.get('kick_oauth_state')?.value;
  const verifier = jar.get('kick_pkce_verifier')?.value;

  const origin = req.nextUrl.origin;
  const redirectOk = new URL('/profile', origin);
  redirectOk.searchParams.set('kick', 'connected');
  const redirectErr = new URL('/', origin);
  redirectErr.searchParams.set('kick', 'error');
  const redirectToAuth = new URL('/auth', origin);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Si no hay usuario autenticado, redirigir a /auth para que se registre/inicie sesión
      console.log('Usuario no autenticado, redirigiendo a /auth');
      const r = NextResponse.redirect(redirectToAuth);
      r.cookies.set('kick_pkce_verifier', '', { maxAge: 0, path: '/' });
      r.cookies.set('kick_oauth_state', '', { maxAge: 0, path: '/' });
      return r;
    }

    if (!code || !state || !verifier || state !== expectState) {
      console.error('Parámetros de OAuth inválidos');
      const r = NextResponse.redirect(redirectErr);
      r.cookies.set('kick_pkce_verifier', '', { maxAge: 0, path: '/' });
      r.cookies.set('kick_oauth_state', '', { maxAge: 0, path: '/' });
      return r;
    }

    // Intercambio de tokens
    const redirectUri = process.env.NODE_ENV === 'production'
      ? 'https://clasharena.live/api/auth/kick/callback'
      : 'http://localhost:3000/api/auth/kick/callback';

    const tokenResp = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KICK_CLIENT_ID!,
        client_secret: process.env.KICK_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        code_verifier: verifier,
        code
      })
    });

    if (!tokenResp.ok) {
      console.error('Kick token error:', tokenResp.status, await tokenResp.text());
      const r = NextResponse.redirect(redirectErr);
      r.cookies.set('kick_pkce_verifier', '', { maxAge: 0, path: '/' });
      r.cookies.set('kick_oauth_state', '', { maxAge: 0, path: '/' });
      return r;
    }

    const tokens = await tokenResp.json();

    // Obtener información del usuario de Kick
    const userResponse = await fetch('https://kick.com/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user data from Kick');
    }

    const userData = await userResponse.json();

    // Guardar en Supabase
    const { error: upsertError } = await supabase
      .from('user_connections')
      .upsert({
        user_id: user.id,
        kick_id: userData.id,
        kick_username: userData.username,
        kick_display_name: userData.display_name,
        kick_profile_image: userData.profile_image_url,
        kick_access_token: tokens.access_token,
        kick_refresh_token: tokens.refresh_token,
        kick_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error al guardar conexión de Kick:', upsertError);
      const r = NextResponse.redirect(redirectErr);
      r.cookies.set('kick_pkce_verifier', '', { maxAge: 0, path: '/' });
      r.cookies.set('kick_oauth_state', '', { maxAge: 0, path: '/' });
      return r;
    }

    const r = NextResponse.redirect(redirectOk);
    r.cookies.set('kick_pkce_verifier', '', { maxAge: 0, path: '/' });
    r.cookies.set('kick_oauth_state', '', { maxAge: 0, path: '/' });
    return r;
  } catch (error) {
    console.error('Error in Kick callback:', error);
    const r = NextResponse.redirect(redirectErr);
    r.cookies.set('kick_pkce_verifier', '', { maxAge: 0, path: '/' });
    r.cookies.set('kick_oauth_state', '', { maxAge: 0, path: '/' });
    return r;
  }
}
