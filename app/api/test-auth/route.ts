import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing authentication...');
    
    const supabase = supabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('Auth test result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      error: error?.message 
    });

    if (error) {
      return NextResponse.json({ 
        authenticated: false, 
        error: error.message 
      });
    }

    if (!user) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No user found in session' 
      });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('Test auth error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: error.message 
    });
  }
}
