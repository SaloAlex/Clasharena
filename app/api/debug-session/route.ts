import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // No-op for read-only
          },
        },
      }
    );

    // Obtener sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Obtener usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    return NextResponse.json({
      success: true,
      session: {
        exists: !!session,
        user: session?.user?.email,
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
      },
      user: {
        exists: !!user,
        email: user?.email,
        id: user?.id,
        metadata: user?.user_metadata,
      },
      errors: {
        session: sessionError?.message,
        user: userError?.message,
      },
      cookies: cookieStore.getAll().map(c => ({
        name: c.name,
        value: c.value.substring(0, 20) + '...',
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
