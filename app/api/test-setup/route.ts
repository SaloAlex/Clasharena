import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { riotApi } from '@/lib/riot/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Probar rate limiting
    const rateLimitResult = await checkRateLimit('public', clientIP);
    
    // Probar Riot API
    let riotApiStatus = 'not tested';
    try {
      const champions = await riotApi.getChampions();
      riotApiStatus = `working (${Object.keys(champions.data).length} champions)`;
    } catch (error: any) {
      riotApiStatus = `error: ${error.message}`;
    }

    // Verificar variables de entorno
    const envCheck = {
      RIOT_API_KEY: !!process.env.RIOT_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL,
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clientIP,
      rateLimit: {
        success: rateLimitResult.success,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      },
      riotApi: {
        status: riotApiStatus,
      },
      environment: envCheck,
      features: {
        rsoOAuth: true,
        leaderboard: true,
        rateLimiting: true,
        authentication: true,
        databaseOptimization: true,
      },
    });

  } catch (error: any) {
    console.error('Test setup error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
