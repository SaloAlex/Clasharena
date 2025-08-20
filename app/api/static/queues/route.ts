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
    // Obtener datos de colas
    // const queuesData = await riotApi.getQueues();
    
    // Filtrar solo las colas relevantes para torneos
    const relevantQueues = [
      400, // Normal Draft Pick
      420, // Ranked Solo/Duo
      430, // Normal Blind Pick
      440, // Ranked Flex
      450, // ARAM
      700, // Clash
      900, // URF
      1020, // One for All
      1300, // Nexus Blitz
      1400, // Ultimate Spellbook
    ];

    // TODO: Migrar a nuevo cliente unificado - código temporalmente comentado
    /*
    const queues = queuesData
      .filter((queue: any) => relevantQueues.includes(queue.queueId))
      .map((queue: any) => ({
        queueId: queue.queueId,
        map: queue.map,
        description: queue.description,
        notes: queue.notes
      }));
    */

    return NextResponse.json({
      success: false,
      error: 'Endpoint temporalmente deshabilitado - migrando a nuevo cliente',
      message: 'Este endpoint será reimplementado con el nuevo cliente unificado'
    }, { status: 503 });

  } catch (error: any) {
    console.error('Error obteniendo colas:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Error al obtener datos de colas'
    }, { status: 500 });
  }
}
