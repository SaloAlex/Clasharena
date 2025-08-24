'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { TournamentPointAdjustment } from './TournamentPointAdjustment';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface TournamentLeaderboardProps {
  tournamentId: string;
  showCompleteButton?: boolean;
}

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  summoner_name: string | null;
  region: string | null;
  matches_played: number;
  total_points: number;
  wins: number;
  losses: number;
  avg_kda: number;
  last_match_at: string | null;
}

export function TournamentLeaderboard({ tournamentId, showCompleteButton = true }: TournamentLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClientComponentClient();

  const checkAdminStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Verificar si el usuario es el creador del torneo
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('creator_id')
        .eq('id', tournamentId)
        .single();

      setIsAdmin(tournament?.creator_id === session.user.id);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }, [tournamentId, supabase]);

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/leaderboard`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar el leaderboard');
      }

      setLeaderboard(data.leaderboard);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadLeaderboard();
    checkAdminStatus();
  }, [loadLeaderboard, checkAdminStatus]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/scan`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar el leaderboard');
      }

      toast.success('Leaderboard actualizado');
      loadLeaderboard();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
          {showCompleteButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">
            Cargando leaderboard...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No hay participantes aún
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-white">
                    {index === 0 ? (
                      <Medal className="w-5 h-5 text-yellow-500" />
                    ) : index === 1 ? (
                      <Medal className="w-5 h-5 text-slate-300" />
                    ) : index === 2 ? (
                      <Medal className="w-5 h-5 text-amber-600" />
                    ) : (
                      <span className="text-slate-400">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {entry.summoner_name || 'Sin nombre'}
                      {entry.region && (
                        <span className="text-slate-400 ml-2 text-sm">{entry.region}</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400">
                      {entry.matches_played} partidas • {entry.wins}W {entry.losses}L • KDA {entry.avg_kda.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {entry.total_points}
                    </div>
                    <div className="text-sm text-slate-400">puntos</div>
                  </div>
                  {isAdmin && (
                    <TournamentPointAdjustment
                      tournamentId={tournamentId}
                      userId={entry.user_id}
                      userName={entry.summoner_name || 'Sin nombre'}
                      onAdjustmentComplete={loadLeaderboard}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}