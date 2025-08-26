import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Obtener la sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Obtener todas las cookies para debugging
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
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
        count: allCookies.length,
        names: allCookies.map(c => c.name).filter(name => name.includes('supabase') || name.includes('sb-'))
      },
      errors: {
        session: sessionError?.message,
        user: userError?.message
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
