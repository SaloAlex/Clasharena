'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';

interface Match {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  queue: {
    id: number;
    description: string;
    map: string;
  };
  champion: {
    id: number;
    name: string;
    title: string;
    image: string;
  };
  stats: {
    win: boolean;
    kills: number;
    deaths: number;
    assists: number;
    kda: string;
    cs: number;
    gold: number;
    damageDealt: number;
    visionScore: number;
  };
  team: {
    teamId: number;
    position: string;
    lane: string;
  };
}

interface MatchHistoryProps {
  puuid: string;
}

export function MatchHistory({ puuid }: MatchHistoryProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, [puuid]);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/player/matches/${puuid}?count=20`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener las partidas');
      }
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error al cargar las partidas');
      }

      setMatches(data.matches);
    } catch (error: any) {
      setError(error.message);
      console.error('Error cargando partidas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Historial de Partidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Historial de Partidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-400 py-4">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 mt-6">
      <CardHeader>
        <CardTitle className="text-white">Historial de Partidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.matchId}
              className={`p-4 rounded-lg ${
                match.stats.win ? 'bg-green-900/20' : 'bg-red-900/20'
              }`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Información básica */}
                <div className="col-span-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={match.champion.image}
                      alt={match.champion.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="text-white font-medium">{match.champion.name}</p>
                      <p className="text-sm text-slate-400">{match.queue.description}</p>
                    </div>
                  </div>
                </div>

                {/* KDA y Farm */}
                <div className="col-span-3">
                  <div className="text-center">
                    <p className="text-white text-lg font-bold">
                      {match.stats.kills} / {match.stats.deaths} / {match.stats.assists}
                    </p>
                    <p className="text-sm text-slate-400">
                      KDA: {match.stats.kda} - CS: {match.stats.cs}
                    </p>
                  </div>
                </div>

                {/* Daño y Visión */}
                <div className="col-span-2">
                  <div className="text-center">
                    <p className="text-white">
                      {(match.stats.damageDealt / 1000).toFixed(1)}k
                    </p>
                    <p className="text-sm text-slate-400">
                      Visión: {match.stats.visionScore}
                    </p>
                  </div>
                </div>

                {/* Duración y Tiempo */}
                <div className="col-span-2">
                  <div className="text-center">
                    <p className="text-white">{match.gameDuration} min</p>
                    <p className="text-sm text-slate-400">
                      {formatDistance(new Date(match.gameCreation), new Date(), {
                        addSuffix: true,
                        locale: es
                      })}
                    </p>
                  </div>
                </div>

                {/* Resultado */}
                <div className="col-span-2">
                  <div className="text-center">
                    <p className={`font-bold ${
                      match.stats.win ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {match.stats.win ? 'Victoria' : 'Derrota'}
                    </p>
                    <p className="text-sm text-slate-400">
                      {match.team.position || match.team.lane}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {matches.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No hay partidas recientes
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
