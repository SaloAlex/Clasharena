import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
    const { data: isAdmin, error: adminError } = await supabase
      .from('tournament_admins')
      .select()
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)
      .single();

    if (adminError || !isAdmin) {
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
    const { data: adjustment, error: adjustmentError } = await supabase
      .from('tournament_point_adjustments')
      .insert({
        tournament_id: tournamentId,
        user_id: userId,
        points,
        reason,
        evidence_url: evidenceUrl,
        match_id: matchId,
        match_date: matchDate ? new Date(matchDate).toISOString() : null,
        created_by: user.id,
        notes
      })
      .select()
      .single();

    if (adjustmentError) {
      throw adjustmentError;
    }

    // Registrar en el historial de actividad del torneo
    const { error: activityError } = await supabase
      .from('tournament_activities')
      .insert({
        tournament_id: tournamentId,
        user_id: user.id,
        activity_type: 'POINTS_ADJUSTED',
        details: {
          adjustment_id: adjustment.id,
          points,
          reason,
          target_user_id: userId
        }
      });

    if (activityError) {
      console.error('Error registrando actividad:', activityError);
    }

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