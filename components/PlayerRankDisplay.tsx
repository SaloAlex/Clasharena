'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, Trophy } from 'lucide-react';
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

  const getRankColor = (tier: string) => {
    const colors: { [key: string]: string } = {
      'IRON': 'bg-gray-600 text-white',
      'BRONZE': 'bg-amber-700 text-white',
      'SILVER': 'bg-gray-400 text-white',
      'GOLD': 'bg-yellow-500 text-white',
      'PLATINUM': 'bg-emerald-400 text-white',
      'EMERALD': 'bg-emerald-500 text-white',
      'DIAMOND': 'bg-blue-500 text-white',
      'MASTER': 'bg-purple-600 text-white',
      'GRANDMASTER': 'bg-red-600 text-white',
      'CHALLENGER': 'bg-yellow-400 text-black'
    };
    return colors[tier] || 'bg-slate-600 text-white';
  };

  if (isLoading && !rank) {
    return (
      <Card className={`border-slate-700 bg-slate-800/50 ${className}`}>
        <CardHeader>
          <CardTitle className="text-white">Rango</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !rank) {
    return (
      <Card className={`border-slate-700 bg-slate-800/50 ${className}`}>
        <CardHeader>
          <CardTitle className="text-white">Rango</CardTitle>
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
    <Card className={`border-slate-700 bg-slate-800/50 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Rango
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
        {lastRefresh && (
          <p className="text-xs text-slate-400">
            Última actualización: {new Date(lastRefresh).toLocaleString('es-ES')}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {rank ? (
          <div className="space-y-4">
            {/* SoloQ */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm font-medium">SoloQ:</span>
              {rank.soloQ ? (
                <Badge className={getRankColor(rank.soloQ.tier)}>
                  {rank.soloQ.tier} {rank.soloQ.rank} • {rank.soloQ.lp} LP
                </Badge>
              ) : (
                <span className="text-slate-500 text-sm">Unranked</span>
              )}
            </div>

            {/* Flex */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm font-medium">Flex:</span>
              {rank.flex ? (
                <Badge className={getRankColor(rank.flex.tier)}>
                  {rank.flex.tier} {rank.flex.rank} • {rank.flex.lp} LP
                </Badge>
              ) : (
                <span className="text-slate-500 text-sm">Unranked</span>
              )}
            </div>

            {/* Estadísticas si están disponibles */}
            {(rank.soloQ || rank.flex) && (
              <div className="pt-2 border-t border-slate-600">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {rank.soloQ && (
                    <div>
                      <p className="text-slate-400">SoloQ W/L:</p>
                      <p className="text-white">
                        {rank.soloQ.wins}W / {rank.soloQ.losses}L 
                        {rank.soloQ.hotStreak && <span className="text-red-400 ml-1">🔥</span>}
                      </p>
                    </div>
                  )}
                  {rank.flex && (
                    <div>
                      <p className="text-slate-400">Flex W/L:</p>
                      <p className="text-white">
                        {rank.flex.wins}W / {rank.flex.losses}L
                        {rank.flex.hotStreak && <span className="text-red-400 ml-1">🔥</span>}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="pt-2 border-t border-slate-600">
              <p className="text-xs text-slate-400">
                Summoner: {summonerName}
              </p>
              <p className="text-xs text-slate-400">
                Región: {rank.platformUsed.toUpperCase()}
                {rank.platformUsed !== rank.platformRequested && (
                  <span className="text-yellow-400 ml-1">
                    (detectada automáticamente)
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm mb-3">No hay datos de rango disponibles</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Obtener Rango
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
