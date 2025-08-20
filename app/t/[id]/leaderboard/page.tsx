import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
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

async function getTournament(supabase: any, id: string) {
  try {
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        registrations: tournament_registrations(count)
      `)
      .eq('id', id)
      .single();

    if (error || !tournament) {
      notFound();
    }

    return {
      ...tournament,
      _count: {
        registrations: tournament.registrations[0].count
      }
    };
  } catch (error) {
    console.error('Error fetching tournament:', error);
    throw new Error('Failed to load tournament');
  }
}

async function getLeaderboard(
  supabase: any,
  tournamentId: string, 
  region?: string, 
  queue?: string, 
  page: number = 1, 
  search?: string
) {
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .rpc('get_tournament_leaderboard', {
      p_tournament_id: tournamentId,
      p_region: region || null,
      p_search: search ? `%${search}%` : null,
      p_limit: pageSize,
      p_offset: offset
    });

  const { data: leaderboard, error } = await query;

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw new Error('Failed to load leaderboard');
  }

  return leaderboard || [];
}

async function getLeaderboardStats(supabase: any, tournamentId: string) {
  const { data: stats, error } = await supabase
    .rpc('get_tournament_stats', {
      p_tournament_id: tournamentId
    });

  if (error) {
    console.error('Error fetching stats:', error);
    throw new Error('Failed to load stats');
  }

  return stats[0];
}

async function getRegions(supabase: any, tournamentId: string) {
  const { data: regions, error } = await supabase
    .from('tournament_registrations')
    .select(`
      riot_accounts!inner(
        routing
      )
    `)
    .eq('tournament_id', tournamentId)
    .eq('riot_accounts.verified', true);

  if (error) {
    console.error('Error fetching regions:', error);
    throw new Error('Failed to load regions');
  }

  return regions.map((r: any) => ({
    region: r.riot_accounts.routing
  }));
}

export default async function TournamentLeaderboardPage({ 
  params, 
  searchParams 
}: LeaderboardPageProps) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  const tournament = await getTournament(supabase, params.id);
  
  const page = parseInt(searchParams.page || '1');
  const region = searchParams.region;
  const search = searchParams.search;
  
  const [leaderboard, stats, regions] = await Promise.all([
    getLeaderboard(supabase, params.id, region, undefined, page, search),
    getLeaderboardStats(supabase, params.id),
    getRegions(supabase, params.id),
  ]);

  const totalCount = leaderboard.length > 0 ? leaderboard[0].total_count : 0;
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