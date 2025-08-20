'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayerStats } from '@/components/PlayerStats';
import Image from 'next/image';

interface MatchItem {
  name: string;
  image: string;
  gold: number;
}

interface MatchRuneStyle {
  name: string;
  icon: string;
}

interface MatchBuild {
  summonerSpells?: {
    d?: { name: string; image: string; };
    f?: { name: string; image: string; };
  };
  items?: MatchItem[];
  runes?: {
    primary?: {
      style: MatchRuneStyle;
    };
    secondary?: {
      style: MatchRuneStyle;
    };
  };
}

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
  build?: MatchBuild;
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

  const calculateStats = useCallback((matches: Match[]) => {
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
      const championName = match.champion?.name || 'Unknown';
      const role = match.team?.position || match.team?.lane || 'Unknown';
      
      championsCount[championName] = (championsCount[championName] || 0) + 1;
      rolesCount[role] = (rolesCount[role] || 0) + 1;
      
      totalKills += match.stats?.kills || 0;
      totalDeaths += match.stats?.deaths || 0;
      totalAssists += match.stats?.assists || 0;
      totalCS += match.stats?.cs || 0;
      totalDuration += match.gameDuration || 0;
      if (match.stats?.win) wins++;
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
  }, []);

  const loadMatches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/player/matches?puuid=${encodeURIComponent(puuid)}&count=20`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener las partidas');
      }
      
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Error al cargar las partidas');
      }

      setMatches(data.data.matches);
      calculateStats(data.data.matches);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [puuid, calculateStats]);

  useEffect(() => {
    loadMatches();
    
    // Actualizar cada 2 minutos
    const interval = setInterval(loadMatches, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadMatches]);

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
    <div className="space-y-6">
      {stats && <PlayerStats stats={stats} />}
      
      <Card className="border-slate-700 bg-slate-800/50">
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
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2 p-4">
              {matches
                .filter(match => selectedQueue === 'all' || match.queue?.description?.toLowerCase().includes(selectedQueue))
                .map((match) => (
                  <div
                    key={match.matchId}
                    className={`p-4 rounded-lg transition-all hover:scale-[1.02] ${
                      match.stats?.win ? 'bg-green-900/20 hover:bg-green-900/30' : 'bg-red-900/20 hover:bg-red-900/30'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Información del Campeón */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Image
                              src={match.champion?.image || '/Logo.png'}
                              alt={match.champion?.name || 'Unknown'}
                              width={48}
                              height={48}
                              className="rounded-full border-2 border-slate-600"
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
                              <span className="text-xs font-bold">
                                {match.team?.position === 'UTILITY' ? 'SUP' : 
                                 match.team?.position === 'BOTTOM' ? 'ADC' :
                                 match.team?.position?.slice(0, 3).toUpperCase() || '?'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-white font-medium">{match.champion?.name || 'Unknown'}</p>
                            <p className="text-sm text-slate-400">{match.queue?.description || 'Unknown'}</p>
                          </div>
                        </div>
                      </div>

                      {/* KDA y Farm */}
                      <div className="col-span-2">
                        <div className="text-center">
                          <p className="text-white text-lg font-bold">
                            {match.stats?.kills || 0} / <span className="text-red-400">{match.stats?.deaths || 0}</span> / {match.stats?.assists || 0}
                          </p>
                          <div className="flex items-center justify-center space-x-3 text-sm text-slate-400">
                            <span>KDA: {match.stats?.kda || '0.00'}</span>
                            <span>•</span>
                            <span>CS: {match.stats?.cs || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Builds y Runas */}
                      <div className="col-span-3">
                        <div className="flex items-center justify-center gap-2">
                          {/* Hechizos de invocador */}
                          <div className="flex flex-col gap-1">
                            {match.build?.summonerSpells?.d && (
                              <Image 
                                src={match.build.summonerSpells.d.image}
                                alt={match.build.summonerSpells.d.name}
                                width={24}
                                height={24}
                                className="rounded-md"
                                title={match.build.summonerSpells.d.name}
                              />
                            )}
                            {match.build?.summonerSpells?.f && (
                              <Image 
                                src={match.build.summonerSpells.f.image}
                                alt={match.build.summonerSpells.f.name}
                                width={24}
                                height={24}
                                className="rounded-md"
                                title={match.build.summonerSpells.f.name}
                              />
                            )}
                          </div>

                          {/* Items */}
                          <div className="grid grid-cols-4 gap-1">
                            {match.build?.items?.map((item: MatchItem, index: number) => (
                              <div key={index} className="relative group">
                                <Image 
                                  src={item.image}
                                  alt={item.name}
                                  width={24}
                                  height={24}
                                  className="rounded-md"
                                />
                                <div className="absolute hidden group-hover:block z-10 -bottom-20 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-slate-400">{item.gold}g</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Runas */}
                          {match.build?.runes?.primary?.style && (
                            <div className="flex items-center gap-1">
                              <div className="relative group">
                                <Image 
                                  src={match.build.runes.primary.style.icon}
                                  alt={match.build.runes.primary.style.name}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                                <div className="absolute hidden group-hover:block z-10 -bottom-20 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap">
                                  {match.build.runes.primary.style.name}
                                </div>
                              </div>
                              {match.build.runes.secondary?.style && (
                                <div className="relative group">
                                  <Image 
                                    src={match.build.runes.secondary.style.icon}
                                    alt={match.build.runes.secondary.style.name}
                                    width={20}
                                    height={20}
                                    className="rounded-full opacity-75"
                                  />
                                  <div className="absolute hidden group-hover:block z-10 -bottom-20 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap">
                                    {match.build.runes.secondary.style.name}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Daño y Visión */}
                      <div className="col-span-2">
                        <div className="text-center">
                          <p className="text-white">
                            {((match.stats?.damageDealt || 0) / 1000).toFixed(1)}k dmg
                          </p>
                          <p className="text-sm text-slate-400">
                            Visión: {match.stats?.visionScore || 0}
                          </p>
                        </div>
                      </div>

                      {/* Resultado y Tiempo */}
                      <div className="col-span-2">
                        <div className="text-center">
                          <p className={`font-bold ${
                            match.stats?.win ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {match.stats?.win ? 'Victoria' : 'Derrota'}
                          </p>
                          <p className="text-sm text-slate-400">
                            {match.gameDuration || 0} min • {formatDistance(new Date(match.gameCreation || Date.now()), new Date(), {
                              addSuffix: true,
                              locale: es,
                              includeSeconds: true
                            }).replace('dentro de', 'hace')}
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
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}