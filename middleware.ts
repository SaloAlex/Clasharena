import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    const { pathname } = request.nextUrl;
    
    // Rutas que requieren autenticación
    const PROTECTED_ROUTES = ['/settings', '/link-riot', '/api/tournaments', '/api/jobs'];
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    
    // Solo procesar rutas específicas
    if (pathname === '/link-riot' || pathname === '/auth' || isProtectedRoute) {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      // Si está en una ruta protegida y no tiene sesión, redirigir a auth
      if (isProtectedRoute && !session && !pathname.startsWith('/api/')) {
        const redirectUrl = new URL('/auth', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Si está en /auth y tiene sesión, redirigir
      if (pathname === '/auth' && session) {
        const redirectTo = request.nextUrl.searchParams.get('redirect') || '/tournaments';
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }

    return response;

  } catch (error) {
    console.error('❌ Middleware error:', error);
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};