'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Search, Filter, Users, Target, TrendingUp, Globe, Calendar } from 'lucide-react';
import { formatDistance } from 'date-fns';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  status: string;
  _count: {
    registrations: number;
  };
}

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
  total_count?: number;
}

interface LeaderboardStats {
  total_participants: number;
  total_matches: number;
  avg_points_per_match: number;
  max_points: number;
  regions_count: number;
}

interface LeaderboardPageProps {
  tournament: Tournament;
  leaderboard: LeaderboardEntry[];
  stats: LeaderboardStats;
  regions: { region: string }[];
  currentPage: number;
  totalPages: number;
  currentRegion?: string;
  currentSearch?: string;
}

const REGION_NAMES: Record<string, string> = {
  'AMERICAS': 'Americas',
  'EUROPE': 'Europe',
  'ASIA': 'Asia',
};

export function LeaderboardPage({
  tournament,
  leaderboard,
  stats,
  regions,
  currentPage,
  totalPages,
  currentRegion,
  currentSearch,
}: LeaderboardPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch || '');

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Reset to page 1 when filters change
    params.delete('page');
    
    router.push(`/t/${tournament.id}/leaderboard?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilters({ search: searchValue || undefined });
  };

  const handleRegionChange = (region: string) => {
    updateFilters({ region: region === 'all' ? undefined : region });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/t/${tournament.id}/leaderboard?${params.toString()}`);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (index === 1) return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
    if (index === 2) return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
    return 'bg-slate-700/50 text-slate-300 border-slate-600/30';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{tournament.name} - Leaderboard</h1>
          <p className="text-slate-400">
            {tournament._count.registrations} participants • {stats.total_matches} matches played
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/t/${tournament.id}`}>
            ← Back to Tournament
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="tournament-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-slate-400">Participants</p>
                <p className="text-2xl font-bold">{stats.total_participants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="tournament-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-slate-400">Total Matches</p>
                <p className="text-2xl font-bold">{stats.total_matches}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="tournament-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-slate-400">Avg Points/Match</p>
                <p className="text-2xl font-bold">
                  {stats.avg_points_per_match ? stats.avg_points_per_match.toFixed(1) : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="tournament-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Globe className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-slate-400">Regions</p>
                <p className="text-2xl font-bold">{stats.regions_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="tournament-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by summoner name..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Select value={currentRegion || 'all'} onValueChange={handleRegionChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.region} value={region.region}>
                    {REGION_NAMES[region.region] || region.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="tournament-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </CardTitle>
          <CardDescription>
            Showing {leaderboard.length} of {leaderboard[0]?.total_count || 0} participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length > 0 ? (
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.user_id}
                  className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${getRankColor(index)}`}>
                      {getRankBadge(index)}
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="font-medium text-lg">
                        {entry.summoner_name || entry.display_name || entry.email}
                      </span>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{entry.region}</span>
                        <span>{entry.wins}W - {entry.losses}L</span>
                        <span>{entry.matches_played} games</span>
                        {entry.avg_kda && (
                          <span>KDA: {entry.avg_kda.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-400">
                      {entry.total_points} pts
                    </div>
                    {entry.last_match_at && (
                      <div className="text-xs text-slate-400">
                        Last: {formatDistance(new Date(entry.last_match_at), new Date(), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-400 mb-2">No participants found</h3>
              <p className="text-slate-500">Try adjusting your filters or search terms</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
