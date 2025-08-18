'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Star, Trophy } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';

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
}

interface ChampionMasteryProps {
  puuid: string;
  region: string;
}

export function ChampionMastery({ puuid, region }: ChampionMasteryProps) {
  const [masteryData, setMasteryData] = useState<ChampionMasteryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMasteryData();
  }, [puuid, region]);

  const loadMasteryData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/player/mastery/${puuid}?region=${region}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al obtener información de maestría');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error al cargar la maestría');
      }

      setMasteryData(data.mastery);
    } catch (error: any) {
      setError(error.message);

    } finally {
      setIsLoading(false);
    }
  };

  const getMasteryColor = (level: number): string => {
    switch (level) {
      case 7: return 'text-purple-400';
      case 6: return 'text-pink-400';
      case 5: return 'text-red-400';
      case 4: return 'text-orange-400';
      case 3: return 'text-blue-400';
      case 2: return 'text-green-400';
      default: return 'text-slate-400';
    }
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

  const filteredMastery = masteryData
    .filter(mastery => 
      mastery.championInfo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (isLoading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Maestría de Campeones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
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
          <CardTitle className="text-white">Maestría de Campeones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 mt-6">
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Maestría de Campeones
            </CardTitle>
            <p className="text-sm text-slate-400 mt-1">
              {filteredMastery.length} campeones con maestría
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar campeón..."
              className="pl-8 bg-slate-800 border-slate-700 text-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
            {filteredMastery.map((mastery) => (
              <div
                key={mastery.championId}
                className="relative group rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-300 hover:scale-[1.02] overflow-hidden"
              >
                {/* Fondo del campeón (versión desenfocada) */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{ 
                    backgroundImage: `url(${mastery.championInfo.image})`,
                    filter: 'blur(4px)'
                  }}
                />

                <div className="relative p-4">
                  {/* Encabezado con imagen y nombre */}
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img
                        src={mastery.championInfo.image}
                        alt={mastery.championInfo.name}
                        className="w-16 h-16 rounded-lg border-2 border-slate-600 group-hover:border-slate-500 transition-colors"
                      />
                      <div 
                        className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-slate-800 
                          flex items-center justify-center font-bold ${getMasteryColor(mastery.championLevel)}
                          border-2 border-slate-700`}
                      >
                        {mastery.championLevel}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg leading-tight">
                        {mastery.championInfo.name}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-1">
                        {mastery.championInfo.title}
                      </p>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Puntos totales</p>
                      <p className="text-lg font-bold text-white">
                        {formatPoints(mastery.championPoints)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Última partida</p>
                      <p className="text-sm text-white">
                        {formatDistance(new Date(mastery.lastPlayTime), new Date(), {
                          addSuffix: true,
                          locale: es
                        }).replace('dentro de', 'hace')}
                      </p>
                    </div>
                  </div>

                  {/* Tokens y Cofre */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: mastery.tokensEarned || 0 }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                      {Array.from({ length: 3 - (mastery.tokensEarned || 0) }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-slate-600" />
                      ))}
                    </div>
                    <div className={`text-sm ${mastery.chestGranted ? 'text-slate-400' : 'text-green-400'}`}>
                      {mastery.chestGranted ? '✓ Cofre obtenido' : '⭐ Cofre disponible'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMastery.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Search className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400 text-lg">No se encontraron campeones</p>
              <p className="text-slate-500 text-sm">Intenta con otro término de búsqueda</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
