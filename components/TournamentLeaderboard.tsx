'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Trophy, Medal } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from './ui/button';
import Link from 'next/link';

interface LeaderboardEntry {
  user_id: string;
  points: number;
  games_played: number;
  wins: number;
  losses: number;
  riot_account?: {
    game_name: string;
    tag_line: string;
  } | null;
}

interface TournamentLeaderboardProps {
  tournamentId: string;
  showCompleteButton?: boolean;
}

export function TournamentLeaderboard({ tournamentId, showCompleteButton = true }: TournamentLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  const loadLeaderboard = async () => {
    try {
      // Primero obtenemos los registros de participantes
      const { data: registrations, error: registrationsError } = await supabase
        .from('tournament_registrations')
        .select('user_id')
        .eq('tournament_id', tournamentId);

      if (registrationsError) {
        console.error('Error loading registrations:', registrationsError);
        return;
      }

      if (!registrations || registrations.length === 0) {
        setLeaderboard([]);
        return;
      }

      // Luego obtenemos las cuentas de Riot de esos usuarios
      const { data: riotAccounts, error: riotError } = await supabase
        .from('riot_accounts')
        .select('user_id, game_name, tag_line')
        .in('user_id', registrations.map(r => r.user_id));

      if (riotError) {
        console.error('Error loading riot accounts:', riotError);
        return;
      }

      // Creamos el leaderboard combinando la información
      const leaderboardData = registrations.map(registration => {
        const riotAccount = riotAccounts?.find(account => account.user_id === registration.user_id);
        return {
          user_id: registration.user_id,
          points: 0,
          games_played: 0,
          wins: 0,
          losses: 0,
          riot_account: riotAccount || null
        };
      });

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();

    // Suscribirse a cambios en tournament_registrations
    const channel = supabase
      .channel('tournament_registrations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_registrations',
          filter: `tournament_id=eq.${tournamentId}`
        },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 1:
        return <Medal className="w-5 h-5 text-slate-300" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Star className="w-5 h-5 text-yellow-500" />
              Clasificación
            </CardTitle>
            <CardDescription className="text-slate-400">
              {leaderboard.length} {leaderboard.length === 1 ? 'jugador' : 'jugadores'} en la tabla
            </CardDescription>
          </div>
          {showCompleteButton && leaderboard.length > 3 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/t/${tournamentId}/leaderboard`}>
                Ver Completa
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-slate-400">Cargando clasificación...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center text-slate-400">No hay participantes aún</div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  {getMedalIcon(index)}
                  <div>
                    <div className="text-white">
                      {entry.riot_account ? (
                        <>
                          {entry.riot_account.game_name}
                          <span className="text-slate-400">#{entry.riot_account.tag_line}</span>
                        </>
                      ) : (
                        'Jugador Desconocido'
                      )}
                    </div>
                    <div className="text-sm text-slate-400">
                      {entry.games_played} {entry.games_played === 1 ? 'partida' : 'partidas'} • {entry.wins}V/{entry.losses}D
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-yellow-400">
                  {entry.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}