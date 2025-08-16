'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Clock, Crosshair, Swords, Target, Trophy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface MatchStats {
  totalGames: number;
  wins: number;
  losses: number;
  averageKDA: string;
  averageCS: number;
  averageDuration: number;
  mostPlayedChampion: string;
  mostPlayedRole: string;
}

export function MatchHistory({ puuid }: MatchHistoryProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<string>('all');
  const [stats, setStats] = useState<MatchStats | null>(null);

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
      calculateStats(data.matches);
    } catch (error: any) {
      setError(error.message);
      console.error('Error cargando partidas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (matches: Match[]) => {
    if (!matches.length) return;

    const championsCount: { [key: string]: number } = {};
    const rolesCount: { [key: string]: number } = {};
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalCS = 0;
    let totalDuration = 0;
    let wins = 0;

    matches.forEach(match => {
      championsCount[match.champion.name] = (championsCount[match.champion.name] || 0) + 1;
      rolesCount[match.team.position || match.team.lane] = (rolesCount[match.team.position || match.team.lane] || 0) + 1;
      
      totalKills += match.stats.kills;
      totalDeaths += match.stats.deaths;
      totalAssists += match.stats.assists;
      totalCS += match.stats.cs;
      totalDuration += match.gameDuration;
      if (match.stats.win) wins++;
    });

    const mostPlayedChampion = Object.entries(championsCount)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    const mostPlayedRole = Object.entries(rolesCount)
      .sort(([,a], [,b]) => b - a)[0][0];

    setStats({
      totalGames: matches.length,
      wins,
      losses: matches.length - wins,
      averageKDA: totalDeaths > 0 
        ? ((totalKills + totalAssists) / totalDeaths).toFixed(2)
        : 'Perfect',
      averageCS: Math.round(totalCS / matches.length),
      averageDuration: Math.round(totalDuration / matches.length),
      mostPlayedChampion,
      mostPlayedRole
    });
  };

  if (isLoading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Historial de Partidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-3">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-9">
                    <div className="grid grid-cols-4 gap-4">
                      {[...Array(4)].map((_, j) => (
                        <Skeleton key={j} className="h-8" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Historial de Partidas</CardTitle>
          <Select value={selectedQueue} onValueChange={setSelectedQueue}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por cola" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las colas</SelectItem>
              <SelectItem value="ranked">Ranked Solo/Duo</SelectItem>
              <SelectItem value="flex">Ranked Flex</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="aram">ARAM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Estadísticas Generales */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-slate-400">Victorias</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white">{stats.wins}</span>
                <span className="text-sm text-slate-400 ml-2">
                  ({Math.round((stats.wins / stats.totalGames) * 100)}%)
                </span>
              </div>
            </div>
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Swords className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-slate-400">KDA Promedio</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white">{stats.averageKDA}</span>
              </div>
            </div>
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm text-slate-400">CS Promedio</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white">{stats.averageCS}</span>
              </div>
            </div>
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-slate-400">Duración Promedio</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white">{stats.averageDuration}m</span>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Partidas */}
        <div className="space-y-4">
          {matches
            .filter(match => selectedQueue === 'all' || match.queue.description.toLowerCase().includes(selectedQueue))
            .map((match) => (
            <div
              key={match.matchId}
              className={`p-4 rounded-lg transition-all hover:scale-[1.02] ${
                match.stats.win ? 'bg-green-900/20 hover:bg-green-900/30' : 'bg-red-900/20 hover:bg-red-900/30'
              }`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Información del Campeón */}
                <div className="col-span-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={match.champion.image}
                        alt={match.champion.name}
                        className="w-12 h-12 rounded-full border-2 border-slate-600"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {match.team.position === 'UTILITY' ? 'SUP' : 
                           match.team.position === 'BOTTOM' ? 'ADC' :
                           match.team.position?.slice(0, 3).toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
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
                      {match.stats.kills} / <span className="text-red-400">{match.stats.deaths}</span> / {match.stats.assists}
                    </p>
                    <div className="flex items-center justify-center space-x-3 text-sm text-slate-400">
                      <span>KDA: {match.stats.kda}</span>
                      <span>•</span>
                      <span>CS: {match.stats.cs}</span>
                    </div>
                  </div>
                </div>

                {/* Daño y Visión */}
                <div className="col-span-2">
                  <div className="text-center">
                    <p className="text-white">
                      {(match.stats.damageDealt / 1000).toFixed(1)}k dmg
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