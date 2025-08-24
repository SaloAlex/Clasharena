'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, AlertCircle, Trophy, Target, TrendingUp, Zap, Crown, Shield } from 'lucide-react';
import { usePlayerRank } from '@/hooks/usePlayerRank';
import { formatRank } from '@/lib/rank-utils';
import { toast } from 'sonner';

interface PlayerRankDisplayProps {
  puuid: string;
  platform: string;
  summonerName?: string;
  className?: string;
}

export function PlayerRankDisplay({ puuid, platform, summonerName, className = '' }: PlayerRankDisplayProps) {
  const { rank, isLoading, error, refreshRank, lastRefresh } = usePlayerRank(puuid);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshRank(puuid, platform);
      toast.success('Rango actualizado correctamente');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRankGradient = (tier: string) => {
    const gradients: { [key: string]: string } = {
      'IRON': 'from-gray-600 to-gray-700',
      'BRONZE': 'from-amber-600 to-amber-700',
      'SILVER': 'from-gray-400 to-gray-500',
      'GOLD': 'from-yellow-500 to-yellow-600',
      'PLATINUM': 'from-emerald-400 to-emerald-500',
      'EMERALD': 'from-emerald-500 to-emerald-600',
      'DIAMOND': 'from-blue-500 to-blue-600',
      'MASTER': 'from-purple-600 to-purple-700',
      'GRANDMASTER': 'from-red-600 to-red-700',
      'CHALLENGER': 'from-yellow-400 to-yellow-500'
    };
    return gradients[tier] || 'from-slate-600 to-slate-700';
  };

  const getRankIcon = (tier: string) => {
    if (tier === 'CHALLENGER') return <Crown className="w-4 h-4" />;
    if (tier === 'GRANDMASTER') return <Crown className="w-4 h-4" />;
    if (tier === 'MASTER') return <Crown className="w-4 h-4" />;
    return <Target className="w-4 h-4" />;
  };

  const calculateWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  if (isLoading && !rank) {
    return (
      <Card className={`border-0 shadow-lg bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-white text-xl">Rango</CardTitle>
              <CardTitle className="text-slate-600 dark:text-slate-400 text-sm font-normal">
                Estadísticas de liga
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !rank) {
    return (
      <Card className={`border-0 shadow-lg bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-white text-xl">Rango</CardTitle>
              <CardTitle className="text-slate-600 dark:text-slate-400 text-sm font-normal">
                Estadísticas de liga
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-400">{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-lg bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-white text-xl">Rango</CardTitle>
              <CardTitle className="text-slate-600 dark:text-slate-400 text-sm font-normal">
                Estadísticas de liga
              </CardTitle>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
        {lastRefresh && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Última actualización: {new Date(lastRefresh).toLocaleString('es-ES')}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {rank ? (
          <div className="space-y-6">
            {/* SoloQ */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700/50 dark:to-blue-900/20 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">SoloQ</span>
                </div>
                {rank.soloQ?.hotStreak && (
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                    <Zap className="w-3 h-3 mr-1" />
                    Racha
                  </Badge>
                )}
              </div>
              {rank.soloQ ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`bg-gradient-to-r ${getRankGradient(rank.soloQ.tier)} text-white border-0 px-3 py-1`}>
                      {getRankIcon(rank.soloQ.tier)}
                      <span className="ml-2 font-semibold">
                        {rank.soloQ.tier} {rank.soloQ.rank}
                      </span>
                    </Badge>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {rank.soloQ.lp} LP
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Win Rate</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {calculateWinRate(rank.soloQ.wins, rank.soloQ.losses)}%
                      </span>
                    </div>
                    <Progress 
                      value={calculateWinRate(rank.soloQ.wins, rank.soloQ.losses)} 
                      className="h-2 bg-slate-200 dark:bg-slate-700"
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{rank.soloQ.wins}W</span>
                      <span>{rank.soloQ.losses}L</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Unranked</p>
                </div>
              )}
            </div>

            {/* Flex */}
            <div className="bg-gradient-to-r from-slate-50 to-purple-50 dark:from-slate-700/50 dark:to-purple-900/20 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">Flex</span>
                </div>
                {rank.flex?.hotStreak && (
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                    <Zap className="w-3 h-3 mr-1" />
                    Racha
                  </Badge>
                )}
              </div>
              {rank.flex ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`bg-gradient-to-r ${getRankGradient(rank.flex.tier)} text-white border-0 px-3 py-1`}>
                      {getRankIcon(rank.flex.tier)}
                      <span className="ml-2 font-semibold">
                        {rank.flex.tier} {rank.flex.rank}
                      </span>
                    </Badge>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {rank.flex.lp} LP
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Win Rate</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {calculateWinRate(rank.flex.wins, rank.flex.losses)}%
                      </span>
                    </div>
                    <Progress 
                      value={calculateWinRate(rank.flex.wins, rank.flex.losses)} 
                      className="h-2 bg-slate-200 dark:bg-slate-700"
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{rank.flex.wins}W</span>
                      <span>{rank.flex.losses}L</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Unranked</p>
                </div>
              )}
            </div>

            {/* Información de región */}
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Región detectada:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {rank.platformUsed.toUpperCase()}
                  </Badge>
                  {rank.platformUsed !== rank.platformRequested && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      Auto-detectada
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Sin datos de rango
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Actualiza tu rango para ver tus estadísticas
            </p>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Obtener Rango
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-400">{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
