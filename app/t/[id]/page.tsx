'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TournamentDetails } from '@/components/TournamentDetails';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft } from 'lucide-react';

interface Tournament {
  id: string;
  title: string;
  description: string;
  format: string;
  status: string;
  start_at: string;
  end_at: string;
  creator_id: string;
  points_per_win: number;
  points_per_loss: number;
  points_first_blood: number;
  points_first_tower: number;
  points_perfect_game: number;
  min_rank: string;
  max_rank: string;
  max_games_per_day: number;
}

interface TournamentRegistration {
  id: string;
  tournament_id: string;
  user_id: string;
  summoner_name: string;
  summoner_id?: string;
  region: string;
  current_rank?: string;
  total_points: number;
  total_matches: number;
  status: string;
  created_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  points: number;
  games_played: number;
  wins: number;
  losses: number;
  last_match_at: string | null;
}

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [userRegistration, setUserRegistration] = useState<TournamentRegistration | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTournamentData = useCallback(async () => {
    try {
      // Cargar datos del torneo
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (tournamentError) throw tournamentError;
      if (!tournamentData) throw new Error('Torneo no encontrado');

      setTournament(tournamentData);

      // Cargar registro del usuario si está autenticado
      if (user) {
        const { data: registrationData } = await supabase
          .from('tournament_registrations')
          .select('*')
          .eq('tournament_id', params.id)
          .eq('user_id', user.id)
          .maybeSingle();

        // Siempre actualizar el estado, incluso si es null
        setUserRegistration(registrationData);
      }

      // TODO: Cargar tabla de clasificación cuando tengamos la tabla de participantes
      // Por ahora, usar array vacío
      setLeaderboard([]);

    } catch (error: any) {
      // Error silencioso - el toast mostrará el mensaje al usuario
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, user]);

  useEffect(() => {
    if (typeof params.id === 'string') {
      loadTournamentData();

      // Suscribirse a cambios en registros del usuario actual
      if (user) {
        const channel = supabase
          .channel('registration_status')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tournament_registrations',
              filter: `tournament_id=eq.${params.id} AND user_id=eq.${user.id}`
            },
            () => {
              loadTournamentData();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    } else {
      setIsLoading(false);
      toast.error('ID de torneo inválido');
    }
  }, [params.id, user?.id, loadTournamentData, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Back Navigation Skeleton */}
            <div className="h-10 bg-slate-700/50 rounded-lg w-48"></div>
            
            {/* Header Skeleton */}
            <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700/50">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-700 rounded-xl"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
              
              {/* Stats Grid Skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-700 rounded w-20"></div>
                        <div className="h-4 bg-slate-700 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Content Grid Skeleton */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 h-96"></div>
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 h-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/tournaments')}
              className="text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Torneos
            </Button>
          </div>
          
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-red-400 mb-4">Torneo no encontrado</h1>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              El torneo que buscas no existe o ha sido eliminado. Verifica la URL o regresa a la lista de torneos.
            </p>
            <Button
              onClick={() => router.push('/tournaments')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Ver Todos los Torneos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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