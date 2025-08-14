import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { TournamentDetails } from '@/components/TournamentDetails';
import { supabaseServer } from '@/lib/supabase/server';

interface LeaderboardEntry {
  user_id: string;
  email: string;
  display_name: string | null;
  summoner_name: string | null;
  region: string;
  matches_played: number;
  total_points: number;
  wins: number;
  losses: number;
  avg_kda: number | null;
  last_match_at: string | null;
}

interface TournamentPageProps {
  params: {
    id: string;
  };
}

async function getTournament(id: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            user: {
              include: {
                linkedAccounts: {
                  where: { game: 'lol' },
                },
              },
            },
          },
        },
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

async function getUserRegistration(tournamentId: string, userId?: string) {
  if (!userId) return null;
  
  return await prisma.tournamentRegistration.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId,
        userId,
      },
    },
  });
}

async function getLeaderboard(tournamentId: string): Promise<LeaderboardEntry[]> {
  // Usar la consulta SQL optimizada para el leaderboard
  const leaderboard = await prisma.$queryRaw<LeaderboardEntry[]>`
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
    LIMIT 50
  `;

  return leaderboard;
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const tournament = await getTournament(params.id);
  
  // Obtener usuario del servidor
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userRegistration = user ? await getUserRegistration(params.id, user.id) : null;
  const leaderboard = await getLeaderboard(params.id);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <TournamentDetails
          tournament={tournament}
          userRegistration={userRegistration}
          leaderboard={leaderboard}
          currentUser={user}
        />
      </div>
    </div>
  );
}