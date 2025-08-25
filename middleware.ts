import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    const supabase = createMiddlewareClient({ req, res })
    
    // Intentar refrescar la sesión
    const { data: { session } } = await supabase.auth.getSession()

    // Si la ruta requiere autenticación y no hay sesión, redirigir a /auth
    const requiresAuth = ['/tournaments', '/profile', '/t/'].some(path => req.nextUrl.pathname.startsWith(path))
    
    if (requiresAuth && !session) {
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    return res
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Middleware: Error con cookies de Supabase, limpiando...', errorMessage)
    
    // Si hay error con las cookies, limpiarlas
    const response = NextResponse.next()
    
    // Lista de cookies de Supabase que pueden causar problemas
    const supabaseCookies = [
      'supabase-auth-token',
      'supabase.auth.token',
      'sb-access-token', 
      'sb-refresh-token',
      'sb-provider-token',
      'sb-pkce-verifier'
    ]
    
    // Limpiar cookies problemáticas
    supabaseCookies.forEach(cookieName => {
      if (req.cookies.get(cookieName)) {
        response.cookies.set({
          name: cookieName,
          value: '',
          expires: new Date(0),
          path: '/',
          httpOnly: false
        })
      }
    })
    
    // También limpiar cookies que empiecen con ciertos prefijos
    req.cookies.getAll().forEach(cookie => {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
        response.cookies.set({
          name: cookie.name,
          value: '',
          expires: new Date(0),
          path: '/',
          httpOnly: false
        })
      }
    })
    
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}