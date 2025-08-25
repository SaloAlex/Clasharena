import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('🧹 Limpiando cookies corruptas...');
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Cookies limpiadas exitosamente' 
    });

    // Lista completa de cookies de Supabase que pueden causar problemas
    const cookiesToClear = [
      'supabase-auth-token',
      'supabase.auth.token', 
      'sb-access-token',
      'sb-refresh-token',
      'sb-provider-token',
      'sb-pkce-verifier',
      'supabase-auth-token-code-verifier',
      'supabase-auth-token-code-challenge'
    ];

    // Limpiar cookies específicas
    cookiesToClear.forEach(cookieName => {
      response.cookies.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    // También buscar y limpiar cualquier cookie que contenga 'supabase' o 'sb-'
    const requestCookies = req.cookies.getAll();
    requestCookies.forEach(cookie => {
      if (cookie.name.includes('supabase') || cookie.name.startsWith('sb-')) {
        console.log('🧹 Limpiando cookie:', cookie.name);
        response.cookies.set({
          name: cookie.name,
          value: '',
          expires: new Date(0),
          path: '/',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }
    });

    console.log('✅ Cookies limpiadas desde servidor');
    return response;

  } catch (error: any) {
    console.error('❌ Error limpiando cookies:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // GET method para acceso directo desde navegador
  return POST(req);
}
