import { NextRequest, NextResponse } from 'next/server';
import { riotApi } from '@/lib/riot/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { puuid: string } }
) {
  try {
    const puuid = params.puuid;
    const searchParams = request.nextUrl.searchParams;
    const platform = (searchParams.get('region') || 'la2').toLowerCase();

    if (!puuid) {
      return NextResponse.json(
        { error: 'PUUID es requerido' },
        { status: 400 }
      );
    }

    if (!process.env.RIOT_API_KEY) {
      return NextResponse.json(
        { error: 'API Key de Riot no configurada' },
        { status: 500 }
      );
    }

    // Obtener maestría de campeones directamente usando PUUID
    const masteryData = await riotApi.getChampionMasteryByPUUID(puuid, platform);

    // Obtener datos de campeones para enriquecer la respuesta
    const championsData = await riotApi.getChampions();

    // Crear mapeo de campeones
    const championMap = Object.values(championsData.data).reduce((acc: any, champion: any) => {
      acc[champion.key] = {
        name: champion.name,
        title: champion.title,
        image: `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.image.full}`
      };
      return acc;
    }, {});

    // Enriquecer datos de maestría con información del campeón
    const enrichedMastery = masteryData.map((mastery: any) => ({
      championId: mastery.championId,
      championLevel: mastery.championLevel,
      championPoints: mastery.championPoints,
      lastPlayTime: mastery.lastPlayTime,
      tokensEarned: mastery.tokensEarned,
      chestGranted: mastery.chestGranted,
      championInfo: championMap[mastery.championId] || {
        name: 'Unknown Champion',
        title: '',
        image: ''
      }
    }));

    return NextResponse.json({
      success: true,
      mastery: enrichedMastery
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Unknown error',
        message: 'Error al obtener información de maestría'
      },
      { status: 500 }
    );
  }
}