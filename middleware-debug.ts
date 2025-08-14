import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Solo procesar /link-riot para debug
  if (pathname === '/link-riot') {
    console.log('🔍 DEBUG: Accediendo a /link-riot');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          },
        },
      }
    );

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      console.log('🔍 DEBUG SESSION:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        error: error?.message,
        cookies: request.cookies.getAll().map(c => c.name)
      });

      // Si no tiene sesión, redirigir a auth
      if (!session) {
        console.log('🚫 No session, redirecting to auth');
        const redirectUrl = new URL('/auth', request.url);
        redirectUrl.searchParams.set('redirect', '/link-riot');
        return NextResponse.redirect(redirectUrl);
      }

      console.log('✅ Has session, allowing access to /link-riot');
      return NextResponse.next();

    } catch (error) {
      console.error('❌ Middleware error:', error);
      return NextResponse.next();
    }
  }

  // Para todas las demás rutas, no hacer nada
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
