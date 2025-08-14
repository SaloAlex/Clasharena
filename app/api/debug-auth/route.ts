import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Verificar variables de entorno
    const envCheck = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      keyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    };

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables missing',
        envCheck,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Probar conexión básica a Supabase
    const { data: healthData, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    // Probar autenticación básica
    const { data: authData, error: authError } = await supabase.auth.getSession();

    return NextResponse.json({
      success: true,
      message: 'Debug information collected',
      envCheck,
      health: {
        success: !healthError,
        error: healthError?.message,
        data: healthData
      },
      auth: {
        success: !authError,
        error: authError?.message,
        hasSession: !!authData.session,
        user: authData.session?.user?.email
      },
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
