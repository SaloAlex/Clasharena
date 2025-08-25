import { NextRequest, NextResponse } from 'next/server';
// TODO: Migrar a nuevo cliente unificado
// import { riotApi } from '@/lib/riot/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { puuid: string } }
) {
  try {
    const puuid = params.puuid;
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region') || 'na1';

    if (!puuid) {
      return NextResponse.json(
        { error: 'PUUID es requerido' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key de Riot no configurada' },
        { status: 500 }
      );
    }

    // TODO: Migrar a nuevo cliente unificado
    // Obtener información del summoner
    // const summonerData = await riotApi.getSummonerByPuuid(puuid, region);
    
    // Obtener información de liga
    // const leagueData = await riotApi.getLeagueEntries(summonerData.id, region);

    // Procesar datos de liga (comentado temporalmente)
    // const soloQueue = leagueData.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5');
    // const flexQueue = leagueData.find((entry: any) => entry.queueType === 'RANKED_FLEX_SR');

    // const formatRank = (entry: any) => {
    //   if (!entry) return null;
    //   
    //   return {
    //     queueType: entry.queueType,
    //     tier: entry.tier,
    //     rank: entry.rank,
    //     leaguePoints: entry.leaguePoints,
    //     wins: entry.wins,
    //     losses: entry.losses,
    //     winRate: ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(1),
    //     hotStreak: entry.hotStreak,
    //     veteran: entry.veteran,
    //     freshBlood: entry.freshBlood,
    //     inactive: entry.inactive,
    //     miniSeries: entry.miniSeries
    //   };
    // };

    return NextResponse.json({
      success: false,
      error: 'Endpoint temporalmente deshabilitado - migrando a nuevo cliente',
      message: 'Este endpoint será reimplementado con el nuevo cliente unificado'
    }, { status: 503 });

  } catch (error: any) {
    console.error('Error obteniendo información del jugador:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Error al obtener información del jugador'
    }, { status: 500 });
  }
}
