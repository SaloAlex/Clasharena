import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function pkce() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  // Permitir el flujo de Kick incluso si el usuario no está autenticado
  // Si no está autenticado, después del callback lo redirigiremos a /auth

  const clientId = process.env.KICK_CLIENT_ID!;
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://clasharena.live/api/auth/kick/callback'
    : 'http://localhost:3000/api/auth/kick/callback';
  
  const { verifier, challenge } = pkce();
  const state = base64url(crypto.randomBytes(16));

  // Construir URL de autorización
  const authUrl = 'https://id.kick.com/oauth/authorize?' + new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user:read channel:read chat:write events:subscribe',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state
  }).toString();

  // Crear respuesta con cookies
  const res = NextResponse.redirect(authUrl);
  
  // Guardar verifier y state en cookies HttpOnly
  res.cookies.set('kick_pkce_verifier', verifier, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax', 
    path: '/',
    maxAge: 300 
  });
  
  res.cookies.set('kick_oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax', 
    path: '/',
    maxAge: 300 
  });

  return res;
}
