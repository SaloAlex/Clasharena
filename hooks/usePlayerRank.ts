import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface RankData {
  tier: string;
  rank: 'I' | 'II' | 'III' | 'IV';
  lp: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  value: number;
}

interface PlayerRank {
  puuid: string;
  platformRequested: string;
  platformUsed: string;
  soloQ: RankData | null;
  flex: RankData | null;
  fetchedAt: number;
}

interface UsePlayerRankReturn {
  rank: PlayerRank | null;
  isLoading: boolean;
  error: string | null;
  refreshRank: (puuid: string, platform: string) => Promise<void>;
  lastRefresh: Date | null;
}

export function usePlayerRank(puuid?: string): UsePlayerRankReturn {
  const { user } = useAuth();
  const [rank, setRank] = useState<PlayerRank | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Cargar rango guardado
  const loadRank = useCallback(async (puuid: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/riot/rank?puuid=${encodeURIComponent(puuid)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al cargar el rango');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error || 'Error al cargar el rango');
      }
      // El nuevo endpoint devuelve directamente el payload, no envuelto en success/rank
      if (data.puuid) {
        setRank(data);
      } else {
        setRank(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Actualizar rango desde Riot
  const refreshRank = useCallback(async (puuid: string, platform: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Verificar cooldown (15 minutos)
      if (lastRefresh && Date.now() - lastRefresh.getTime() < 15 * 60 * 1000) {
        const remainingMinutes = Math.ceil((15 * 60 * 1000 - (Date.now() - lastRefresh.getTime())) / (60 * 1000));
        throw new Error(`Debes esperar ${remainingMinutes} minutos antes de actualizar el rango nuevamente`);
      }

      // Llamar al endpoint que maneja todo internamente
      const response = await fetch(`/api/riot/rank?puuid=${encodeURIComponent(puuid)}&platform=${platform}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el rango');
      }

      const data = await response.json();

      
      if (data.error) {
        throw new Error(data.error || 'Error al actualizar el rango');
      }
      // El nuevo endpoint devuelve directamente el payload
      if (data.puuid) {
        setRank(data);
        setLastRefresh(new Date());
      } else {
        setRank(null);
        setLastRefresh(new Date());
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, lastRefresh]);

  // Cargar rango al montar el componente
  useEffect(() => {
    if (puuid && user) {
      loadRank(puuid);
    }
  }, [puuid, user, loadRank]);

  return {
    rank,
    isLoading,
    error,
    refreshRank,
    lastRefresh
  };
}
