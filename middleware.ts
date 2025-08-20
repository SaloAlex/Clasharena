import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Proteger rutas que requieren autenticación
  const protectedPaths = ['/tournaments', '/profile', '/t/']
  const adminPaths = ['/tournaments/create']
  
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
  const isAdminPath = adminPaths.some(path => request.nextUrl.pathname.startsWith(path))
  const isAuthPage = request.nextUrl.pathname === '/auth'

  // Verificar rutas de admin
  if (isAdminPath) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    if (session.user.email !== 'dvdsalomon6@gmail.com') {
      return NextResponse.redirect(new URL('/tournaments', request.url))
    }
  }

  // Verificar rutas protegidas normales
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si el usuario está autenticado y trata de acceder a /auth, redirigir a /tournaments
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/tournaments', request.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}