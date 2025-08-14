import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { LeaderboardPage } from '@/components/LeaderboardPage';

interface LeaderboardPageProps {
  params: {
    id: string;
  };
  searchParams: {
    region?: string;
    queue?: string;
    page?: string;
    search?: string;
  };
}

async function getTournament(id: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!tournament) {
      notFound();
    }

    return tournament;
  } catch (error) {
    console.error('Error fetching tournament:', error);
    throw new Error('Failed to load tournament');
  }
}

async function getLeaderboard(
  tournamentId: string, 
  region?: string, 
  queue?: string, 
  page: number = 1, 
  search?: string
) {
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Construir la consulta base
  let query = `
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
      MAX(tp.created_at) as last_match_at,
      COUNT(*) OVER() as total_count
    FROM users u
    INNER JOIN tournament_registrations tr ON u.id = tr.user_id
    INNER JOIN linked_riot_accounts la ON u.id = la.user_id AND la.verified = true
    LEFT JOIN tournament_points tp ON tr.tournament_id = tp.tournament_id AND tr.user_id = tp.user_id
    LEFT JOIN match_records mr ON tp.match_id = mr.match_id
    WHERE tr.tournament_id = $1
  `;

  const params: any[] = [tournamentId];
  let paramIndex = 2;

  // Agregar filtros
  if (region) {
    query += ` AND la.routing = $${paramIndex}`;
    params.push(region);
    paramIndex++;
  }

  if (search) {
    query += ` AND (la.summoner_name ILIKE $${paramIndex} OR u.display_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  query += `
    GROUP BY u.id, u.email, u.display_name, la.summoner_name, la.routing
    ORDER BY total_points DESC, wins DESC, avg_kda DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(pageSize, offset);

  const leaderboard = await prisma.$queryRawUnsafe(query, ...params);
  return leaderboard;
}

async function getLeaderboardStats(tournamentId: string) {
  const stats = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT tr.user_id) as total_participants,
      COUNT(DISTINCT tp.match_id) as total_matches,
      AVG(tp.points) as avg_points_per_match,
      MAX(tp.points) as max_points,
      COUNT(DISTINCT la.routing) as regions_count
    FROM tournament_registrations tr
    LEFT JOIN tournament_points tp ON tr.tournament_id = tp.tournament_id AND tr.user_id = tp.user_id
    LEFT JOIN linked_riot_accounts la ON tr.user_id = la.user_id AND la.verified = true
    WHERE tr.tournament_id = ${tournamentId}
  `;

  return stats[0];
}

async function getRegions(tournamentId: string) {
  const regions = await prisma.$queryRaw`
    SELECT DISTINCT la.routing as region
    FROM tournament_registrations tr
    INNER JOIN linked_riot_accounts la ON tr.user_id = la.user_id AND la.verified = true
    WHERE tr.tournament_id = ${tournamentId}
    ORDER BY la.routing
  `;

  return regions;
}

export default async function TournamentLeaderboardPage({ 
  params, 
  searchParams 
}: LeaderboardPageProps) {
  const tournament = await getTournament(params.id);
  
  const page = parseInt(searchParams.page || '1');
  const region = searchParams.region;
  const search = searchParams.search;
  
  const [leaderboard, stats, regions] = await Promise.all([
    getLeaderboard(params.id, region, undefined, page, search),
    getLeaderboardStats(params.id),
    getRegions(params.id),
  ]);

  const totalCount = leaderboard.length > 0 ? (leaderboard[0] as any).total_count : 0;
  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <LeaderboardPage
          tournament={tournament}
          leaderboard={leaderboard}
          stats={stats}
          regions={regions}
          currentPage={page}
          totalPages={totalPages}
          currentRegion={region}
          currentSearch={search}
        />
      </div>
    </div>
  );
}
