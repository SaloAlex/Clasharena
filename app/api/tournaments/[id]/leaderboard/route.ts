import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;

    // Verificar que el torneo existe
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Obtener el leaderboard con puntos acumulados
    const leaderboard = await prisma.$queryRaw`
      SELECT 
        u.id as user_id,
        u.email,
        u.display_name,
        la.summoner_name,
        la.routing as region,
        COUNT(DISTINCT tp.match_id) as matches_played,
        SUM(tp.points) as total_points,
        COUNT(CASE WHEN tp.reason = 'WIN' THEN 1 END) as wins,
        COUNT(CASE WHEN tp.reason = 'LOSS' THEN 1 END) as losses,
        AVG(mr.kda) as avg_kda,
        MAX(tp.created_at) as last_match_at
      FROM users u
      INNER JOIN tournament_registrations tr ON u.id = tr.user_id
      INNER JOIN linked_riot_accounts la ON u.id = la.user_id AND la.verified = true
      LEFT JOIN tournament_points tp ON tr.tournament_id = tp.tournament_id AND tr.user_id = tp.user_id
      LEFT JOIN match_records mr ON tp.match_id = mr.match_id
      WHERE tr.tournament_id = ${tournamentId}
      GROUP BY u.id, u.email, u.display_name, la.summoner_name, la.routing
      ORDER BY total_points DESC, wins DESC, avg_kda DESC
      LIMIT 100
    `;

    // Obtener estadísticas del torneo
    const tournamentStats = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT tr.user_id) as total_participants,
        COUNT(DISTINCT tp.match_id) as total_matches,
        SUM(tp.points) as total_points_awarded,
        AVG(tp.points) as avg_points_per_match
      FROM tournament_registrations tr
      LEFT JOIN tournament_points tp ON tr.tournament_id = tp.tournament_id AND tr.user_id = tp.user_id
      WHERE tr.tournament_id = ${tournamentId}
    `;

    // Obtener las últimas partidas procesadas
    const recentMatches = await prisma.matchRecord.findMany({
      where: {
        matchId: {
          in: await prisma.tournamentPoint.findMany({
            where: { tournamentId },
            select: { matchId: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }).then(points => points.map(p => p.matchId)),
        },
      },
      include: {
        // Aquí podrías incluir más información si es necesario
      },
      orderBy: {
        processedAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        startAt: tournament.startAt,
        endAt: tournament.endAt,
      },
      leaderboard: leaderboard,
      stats: tournamentStats[0],
      recentMatches: recentMatches,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

