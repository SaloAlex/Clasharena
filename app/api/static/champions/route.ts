import { NextRequest, NextResponse } from 'next/server';
// TODO: Migrar a nuevo cliente unificado
// import { riotApi } from '@/lib/riot/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key de Riot no configurada' },
        { status: 500 }
      );
    }

    // TODO: Migrar a nuevo cliente unificado
    // Obtener datos de campeones
    // const championsData = await riotApi.getChampions();
    
    // Procesar y formatear los datos
    const champions = Object.values(championsData.data).map((champion: any) => ({
      id: champion.key,
      name: champion.name,
      title: champion.title,
      image: champion.image.full,
      tags: champion.tags
    }));

    return NextResponse.json({
      success: false,
      error: 'Endpoint temporalmente deshabilitado - migrando a nuevo cliente',
      message: 'Este endpoint será reimplementado con el nuevo cliente unificado'
    }, { status: 503 });

  } catch (error: any) {
    console.error('Error obteniendo campeones:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Error al obtener datos de campeones'
    }, { status: 500 });
  }
}
