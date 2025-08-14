import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/settings',
  '/link-riot',
  '/api/tournaments',
  '/api/jobs',
];

// Rutas que requieren cuenta de LoL vinculada
const LOL_REQUIRED_ROUTES = [
  '/api/tournaments',
  '/api/jobs',
];

// Rutas públicas que no necesitan autenticación
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/tournaments',
  '/api/static',
  '/api/player/info',
  '/api/player/rank',
  '/api/player/matches',
];

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // Verificar sesión
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    const { pathname } = request.nextUrl;
    
    console.log('Middleware processing:', { pathname, hasSession: !!session });

    // Verificar si es una ruta protegida
    const isProtectedRoute = PROTECTED_ROUTES.some(route => 
      pathname.startsWith(route)
    );
    
    console.log('Route check:', { 
      pathname, 
      isProtectedRoute, 
      hasSession: !!session 
    });

    const isLolRequiredRoute = LOL_REQUIRED_ROUTES.some(route => 
      pathname.startsWith(route)
    );

    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname.startsWith(route)
    );

    // Si no hay sesión y es una ruta protegida, redirigir al login
    // Pero NO redirigir rutas de API, solo establecer headers
    if (!session && isProtectedRoute && !pathname.startsWith('/api/')) {
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Si hay sesión pero no tiene cuenta de LoL vinculada y la ruta lo requiere
    if (session && isLolRequiredRoute) {
      const { data: linkedAccounts } = await supabase
        .from('linked_riot_accounts')
        .select('*')
        .eq('userId', session.user.id)
        .eq('verified', true)
        .single();

      if (!linkedAccounts) {
        const redirectUrl = new URL('/link-riot', request.url);
        redirectUrl.searchParams.set('error', 'LoL account required');
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Si está en la página de auth y ya tiene sesión, redirigir a tournaments
    if (pathname === '/auth' && session) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/tournaments';
      console.log('User already authenticated, redirecting from /auth to:', redirectTo);
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // Agregar headers de usuario para uso en las rutas
    // Siempre establecer headers si hay sesión, incluso para rutas de API
    if (session) {
      response.headers.set('x-user-id', session.user.id);
      response.headers.set('x-user-email', session.user.email || '');
      console.log('Middleware: Headers set for user:', session.user.id);
    } else {
      console.log('Middleware: No session found');
    }

    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    
    // En caso de error, permitir el acceso pero loguear el error
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
