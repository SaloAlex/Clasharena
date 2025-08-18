import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario es admin del torneo
    const isAdmin = await prisma.tournamentAdmin.findFirst({
      where: {
        tournamentId,
        userId: user.id
      }
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para ajustar puntos' },
        { status: 403 }
      );
    }

    // Obtener datos del ajuste
    const {
      userId,
      points,
      reason,
      evidenceUrl,
      matchId,
      matchDate,
      notes
    } = await request.json();

    // Validar datos requeridos
    if (!userId || !points || !reason) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Crear el ajuste
    const adjustment = await prisma.tournamentPointAdjustment.create({
      data: {
        tournamentId,
        userId,
        points,
        reason,
        evidenceUrl,
        matchId,
        matchDate: matchDate ? new Date(matchDate) : null,
        createdBy: user.id,
        notes
      }
    });

    // Registrar en el historial de actividad del torneo
    await prisma.tournamentActivity.create({
      data: {
        tournamentId,
        userId: user.id,
        action: 'POINTS_ADJUSTED',
        details: {
          adjustmentId: adjustment.id,
          points,
          reason,
          targetUserId: userId
        }
      }
    });

    return NextResponse.json({
      success: true,
      adjustment
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Error desconocido',
        message: 'Error al ajustar puntos'
      },
      { status: 500 }
    );
  }
}

