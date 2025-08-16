'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TournamentDetails } from '@/components/TournamentDetails';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [userRegistration, setUserRegistration] = useState<TournamentRegistration | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [params.id, user?.id]);

  const loadTournamentData = async () => {
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
        console.log('Checking registration for user:', user.id);
        const { data: registrationData, error: registrationError } = await supabase
          .from('tournament_registrations')
          .select('*')
          .eq('tournament_id', params.id)
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('Registration data:', registrationData);
        console.log('Registration error:', registrationError);

        // Siempre actualizar el estado, incluso si es null
        setUserRegistration(registrationData);
      } else {
        console.log('No user found');
      }

      // TODO: Cargar tabla de clasificación cuando tengamos la tabla de participantes
      // Por ahora, usar array vacío
      setLeaderboard([]);

    } catch (error: any) {
      console.error('Error loading tournament data:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-700 rounded w-1/4"></div>
            <div className="h-4 bg-slate-700 rounded w-2/4"></div>
            <div className="h-64 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-500">Torneo no encontrado</h1>
        </div>
      </div>
    );
  }

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