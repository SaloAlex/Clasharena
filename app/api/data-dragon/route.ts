import { NextResponse } from 'next/server';
import { getValidImageUrl, getChampionImageUrl, getChampionImageUrlByName, getSpellImageUrl, getItemImageUrl } from '@/lib/data-dragon';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const originalUrl = searchParams.get('url');

    if (!type || !id) {
      return NextResponse.json({ 
        error: 'Tipo e ID son requeridos' 
      }, { status: 400 });
    }

    let imageUrl: string;

    try {
      // Intentar obtener la imagen según el tipo
      switch (type) {
        case 'champion':
          // Si es un número, usar championId, si no, usar nombre
          const championId = parseInt(id);
          if (!isNaN(championId)) {
            imageUrl = await getChampionImageUrl(championId);
          } else {
            imageUrl = await getChampionImageUrlByName(id);
          }
          break;
        case 'spell':
          imageUrl = await getSpellImageUrl(id);
          break;
        case 'item':
          imageUrl = await getItemImageUrl(parseInt(id));
          break;
        default:
          throw new Error(`Tipo no soportado: ${type}`);
      }

      // Verificar que la imagen existe
      const testResponse = await fetch(imageUrl, { method: 'HEAD' });
      
      if (!testResponse.ok) {
        // Si tenemos URL original, intentar obtener una válida
        if (originalUrl) {
          imageUrl = await getValidImageUrl(originalUrl, type as any, id);
        } else {
          // Usar fallback por defecto
          imageUrl = type === 'spell' 
            ? 'https://ddragon.leagueoflegends.com/cdn/14.22.1/img/spell/SummonerFlash.png'
            : 'https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/Aatrox.png';
        }
      }

      return NextResponse.json({
        success: true,
        imageUrl,
        type,
        id,
        timestamp: Date.now()
      });

    } catch (error: any) {
      // Fallback por defecto
      const fallbackUrl = type === 'spell' 
        ? 'https://ddragon.leagueoflegends.com/cdn/14.22.1/img/spell/SummonerFlash.png'
        : 'https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/Aatrox.png';

      return NextResponse.json({
        success: true,
        imageUrl: fallbackUrl,
        type,
        id,
        fallback: true,
        error: error.message,
        timestamp: Date.now()
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      error: 'Error procesando solicitud de imagen',
      details: error.message
    }, { status: 500 });
  }
}
