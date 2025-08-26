'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Star, Trophy, Crown, Target, Zap, Clock, AlertCircle } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface ChampionMasteryData {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  tokensEarned: number;
  chestGranted: boolean;
  championInfo: {
    name: string;
    title: string;
    image: string;
  };
  // Campos adicionales para datos estimados
  gamesPlayed?: number;
  winRate?: number;
  averageKda?: number;
  isEstimated?: boolean;
}

interface ChampionMasteryProps {
  puuid: string;
}

export function ChampionMastery({ puuid }: ChampionMasteryProps) {
  const [masteryData, setMasteryData] = useState<ChampionMasteryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadMasteryData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/player/mastery?puuid=${encodeURIComponent(puuid)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al obtener información de maestría');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar la maestría');
      }

      setMasteryData(data.data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [puuid]);

  useEffect(() => {
    loadMasteryData();
  }, [loadMasteryData]);

  const getMasteryGradient = (level: number): string => {
    switch (level) {
      case 7: return 'from-purple-500 to-purple-600';
      case 6: return 'from-pink-500 to-pink-600';
      case 5: return 'from-red-500 to-red-600';
      case 4: return 'from-orange-500 to-orange-600';
      case 3: return 'from-blue-500 to-blue-600';
      case 2: return 'from-green-500 to-green-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getMasteryIcon = (level: number) => {
    if (level >= 7) return <Crown className="w-4 h-4" />;
    if (level >= 5) return <Star className="w-4 h-4" />;
    return <Target className="w-4 h-4" />;
  };

  const formatPoints = (points: number): string => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    }
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  };

  const calculateMasteryProgress = (level: number, points: number): number => {
    // Definir los umbrales de puntos para cada nivel
    const thresholds = {
      1: 0,
      2: 400,
      3: 1200,
      4: 2800,
      5: 6000,
      6: 12600,
      7: 21600
    };

    // Si es nivel 7, el progreso es 100%
    if (level >= 7) {
      return 100;
    }

    // Calcular progreso hacia el siguiente nivel
    const currentThreshold = thresholds[level as keyof typeof thresholds] || 0;
    const nextThreshold = thresholds[(level + 1) as keyof typeof thresholds] || 21600;
    const progressInLevel = points - currentThreshold;
    const pointsNeededForNextLevel = nextThreshold - currentThreshold;
    
    const progress = (progressInLevel / pointsNeededForNextLevel) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const filteredMastery = masteryData
    .filter(mastery => 
      mastery.championInfo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-white text-xl">Maestría de Campeones</CardTitle>
              <CardTitle className="text-slate-600 dark:text-slate-400 text-sm font-normal">
                Progreso y estadísticas
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-white text-xl">Maestría de Campeones</CardTitle>
              <CardTitle className="text-slate-600 dark:text-slate-400 text-sm font-normal">
                Progreso y estadísticas
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-white text-xl">Maestría de Campeones</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-600 dark:text-slate-400 text-sm">
                  {filteredMastery.length} campeones
                </span>
                {masteryData.some(m => m.isEstimated) && (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                    <Zap className="w-3 h-3 mr-1" />
                    Datos estimados
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar campeón..."
              className="pl-10 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredMastery.map((mastery) => (
              <div
                key={mastery.championId}
                className="group relative bg-white dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-300 hover:shadow-lg overflow-hidden"
              >
                {/* Fondo con gradiente sutil */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-700/30 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity"
                />

                <div className="relative p-4">
                  {/* Header con imagen y nivel */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative">
                      <Image
                        src={mastery.championInfo.image}
                        alt={mastery.championInfo.name}
                        width={56}
                        height={56}
                        className="rounded-lg border-2 border-slate-200 dark:border-slate-600 group-hover:border-slate-300 dark:group-hover:border-slate-500 transition-colors"
                      />
                      <div 
                        className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-gradient-to-r ${getMasteryGradient(mastery.championLevel)}
                          flex items-center justify-center font-bold text-white text-sm border-2 border-white dark:border-slate-800 shadow-lg`}
                      >
                        {getMasteryIcon(mastery.championLevel)}
                      </div>
                      {mastery.isEstimated && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-xs text-black font-bold">~</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight truncate">
                        {mastery.championInfo.name}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm truncate">
                        {mastery.championInfo.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`bg-gradient-to-r ${getMasteryGradient(mastery.championLevel)} text-white border-0 text-xs`}>
                          Nivel {mastery.championLevel}
                        </Badge>
                        {mastery.chestGranted && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
                            Cofre
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Puntos de maestría */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Puntos</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatPoints(mastery.championPoints)}
                      </span>
                    </div>
                    <Progress 
                      value={calculateMasteryProgress(mastery.championLevel, mastery.championPoints)} 
                      className="h-2 bg-slate-200 dark:bg-slate-600"
                    />
                  </div>

                  {/* Estadísticas adicionales si están disponibles */}
                  {(mastery.gamesPlayed || mastery.winRate) && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {mastery.gamesPlayed && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Partidas:</span>
                            <span className="ml-1 font-semibold text-slate-900 dark:text-white">
                              {mastery.gamesPlayed}
                            </span>
                          </div>
                        )}
                        {mastery.winRate && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Win Rate:</span>
                            <span className="ml-1 font-semibold text-slate-900 dark:text-white">
                              {mastery.winRate}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Última partida */}
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistance(mastery.lastPlayTime, new Date(), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
