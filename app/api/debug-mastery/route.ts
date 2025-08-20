import { NextResponse } from 'next/server';
import { debugSummonerData, getChampionMasteryFromMatches } from '@/lib/riot';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const puuid = searchParams.get('puuid');
    
    if (!puuid) {
      return NextResponse.json({ error: 'PUUID es requerido' }, { status: 400 });
    }

    console.log(`[DEBUG API] Iniciando debug para PUUID: ${puuid}`);

    // 1. Debug completo del summoner
    const debugResult = await debugSummonerData(puuid);
    
    // 2. Método alternativo
    let alternativeResult = null;
    try {
      alternativeResult = await getChampionMasteryFromMatches(puuid);
    } catch (error) {
      console.log(`[DEBUG API] Método alternativo falló:`, error);
    }

         return NextResponse.json({
       success: true,
       puuid,
       debug: {
         summonerFound: !!debugResult,
         platform: debugResult && typeof debugResult === 'object' ? debugResult.platform : null,
         summonerId: debugResult && typeof debugResult === 'object' ? debugResult.summonerId : null,
         masteryCount: debugResult && typeof debugResult === 'object' ? debugResult.masteryData?.length || 0 : 0,
         sampleMastery: debugResult && typeof debugResult === 'object' ? debugResult.masteryData?.[0] : null
       },
      alternative: {
        success: !!alternativeResult,
        masteryCount: alternativeResult?.length || 0,
        sampleMastery: alternativeResult?.[0]
      },
      recommendations: {
        useOfficial: !!debugResult,
        useAlternative: !debugResult && !!alternativeResult,
        fallbackToAlternative: !debugResult && !!alternativeResult
      }
    });
    
  } catch (error: any) {
    console.error('[DEBUG API] Error:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
