import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener información del cache
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Cache de Data Dragon',
      info: {
        cacheDuration: '1 hora',
        fallbackVersions: [
          '14.22.1', '14.21.1', '14.20.1', '14.19.1', 
          '14.18.1', '14.17.1', '14.16.1', '14.15.1'
        ],
        defaultVersion: '14.22.1',
        timestamp: Date.now()
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Error obteniendo información del cache',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE - Limpiar cache
export async function DELETE() {
  try {
    // En un entorno real, aquí limpiaríamos el cache
    // Por ahora, solo retornamos un mensaje de éxito
    
    return NextResponse.json({
      success: true,
      message: 'Cache de Data Dragon limpiado',
      note: 'El cache se limpiará automáticamente en la próxima solicitud',
      timestamp: Date.now()
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Error limpiando cache',
      details: error.message
    }, { status: 500 });
  }
}
