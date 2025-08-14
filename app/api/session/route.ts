import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== SESSION DEBUG ===');
    
    // Verificar cookies
    const cookies = request.cookies.getAll();
    console.log('All cookies:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
    
    // Verificar headers de middleware
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    console.log('Middleware headers:', { userId, userEmail });
    
    // Intentar obtener sesión de Supabase
    const supabase = supabaseServer();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session result:', { 
      hasSession: !!session, 
      sessionError: sessionError?.message 
    });
    
    // Intentar obtener usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User result:', { 
      hasUser: !!user, 
      userId: user?.id,
      userError: userError?.message 
    });
    
    return NextResponse.json({
      cookies: cookies.length,
      middlewareHeaders: { userId, userEmail },
      session: session ? { id: session.user.id, email: session.user.email } : null,
      user: user ? { id: user.id, email: user.email } : null,
      errors: {
        session: sessionError?.message,
        user: userError?.message
      }
    });

  } catch (error: any) {
    console.error('Session debug error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
