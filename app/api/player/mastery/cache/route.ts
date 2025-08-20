import { NextResponse } from 'next/server';
import { clearMasteryCache, getCacheStats } from '@/lib/riot-mastery-optimized';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener estadísticas del cache
export async function GET() {
  try {
    const stats = getCacheStats();
    
    return NextResponse.json({
      success: true,
      cache: stats,
      timestamp: Date.now()
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Error obteniendo estadísticas del cache',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE - Limpiar cache
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get('puuid');
    
    if (puuid) {
      // Limpiar cache específico
      clearMasteryCache(puuid);
      return NextResponse.json({
        success: true,
        message: `Cache limpiado para PUUID: ${puuid.slice(0, 8)}...`,
        timestamp: Date.now()
      });
    } else {
      // Limpiar todo el cache
      clearMasteryCache();
      return NextResponse.json({
        success: true,
        message: 'Cache completo limpiado',
        timestamp: Date.now()
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      error: 'Error limpiando cache',
      details: error.message
    }, { status: 500 });
  }
}
