import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar cookies
    const cookies = request.cookies.getAll();
    
    // Verificar headers de middleware
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    
    // Intentar obtener sesión de Supabase
    const supabase = supabaseServer();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Intentar obtener usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
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
