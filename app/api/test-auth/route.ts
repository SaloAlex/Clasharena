import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Obtener todas las cookies para debugging
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // Verificar sesión y usuario
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      success: true,
      session: {
        exists: !!session,
        expiresAt: session?.expires_at,
        accessToken: session?.access_token ? 'Present' : 'Missing',
        refreshToken: session?.refresh_token ? 'Present' : 'Missing'
      },
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email
      },
      cookies: {
        total: allCookies.length,
        supabaseCookies: allCookies
          .filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
          .map(c => ({ name: c.name, value: c.value ? 'Present' : 'Empty' }))
      },
      errors: {
        session: sessionError?.message,
        user: userError?.message
      },
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
