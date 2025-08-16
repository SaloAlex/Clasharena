import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect_to = requestUrl.searchParams.get('redirect_to');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Intercambiar el código por una sesión
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL a la que redirigir después del login
  return NextResponse.redirect(new URL(redirect_to || '/', request.url));
}
