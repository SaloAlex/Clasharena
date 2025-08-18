'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';

interface ChampionStat {
  id: number;
  name: string;
  image: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  averageCS: number;
}

interface Match {
  champion: {
    id: number;
    name: string;
    image: string;
  };
  stats: {
    win: boolean;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
  };
}

interface ChampionStatsProps {
  matches: Match[];
}

export function ChampionStats({ matches }: ChampionStatsProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Calcular estadísticas por campeón
  const championStats = matches.reduce<{ [key: number]: ChampionStat }>((acc, match) => {
    const champId = match.champion.id;
    
    if (!acc[champId]) {
      acc[champId] = {
        id: champId,
        name: match.champion.name,
        image: match.champion.image,
        games: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        kda: 0,
        cs: 0,
        averageCS: 0
      };
    }

    const stat = acc[champId];
    stat.games++;
    if (match.stats.win) stat.wins++;
    else stat.losses++;
    stat.kills += match.stats.kills;
    stat.deaths += match.stats.deaths;
    stat.assists += match.stats.assists;
    stat.cs += match.stats.cs;
    
    // Actualizar promedios
    stat.winRate = (stat.wins / stat.games) * 100;
    stat.kda = stat.deaths > 0 ? (stat.kills + stat.assists) / stat.deaths : (stat.kills + stat.assists);
    stat.averageCS = Math.round(stat.cs / stat.games);

    return acc;
  }, {});

  // Convertir a array y ordenar por número de partidas
  const sortedStats = Object.values(championStats)
    .sort((a, b) => b.games - a.games)
    .filter(stat => 
      stat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Card className="border-slate-700 bg-slate-800/50 mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Estadísticas por Campeón</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar campeón..."
              className="pl-8 bg-slate-800 border-slate-700 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {sortedStats.map((stat) => (
              <div
                key={stat.id}
                className="flex items-center p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
              >
                {/* Imagen y nombre del campeón */}
                <div className="flex items-center w-48">
                  <img
                    src={stat.image}
                    alt={stat.name}
                    className="w-10 h-10 rounded-full border border-slate-600"
                  />
                  <span className="ml-3 font-medium text-white">{stat.name}</span>
                </div>

                {/* Partidas y Winrate */}
                <div className="flex-1 text-center">
                  <div className="text-sm text-slate-400">Partidas</div>
                  <div className="text-white">
                    {stat.games} ({stat.winRate.toFixed(1)}% WR)
                  </div>
                </div>

                {/* KDA */}
                <div className="flex-1 text-center">
                  <div className="text-sm text-slate-400">KDA</div>
                  <div className="text-white">
                    {(stat.kills / stat.games).toFixed(1)} / {(stat.deaths / stat.games).toFixed(1)} / {(stat.assists / stat.games).toFixed(1)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {stat.kda.toFixed(2)} KDA
                  </div>
                </div>

                {/* CS */}
                <div className="flex-1 text-center">
                  <div className="text-sm text-slate-400">CS Promedio</div>
                  <div className="text-white">{stat.averageCS}</div>
                </div>

                {/* Record */}
                <div className="w-32 text-center">
                  <div className="text-sm text-slate-400">Record</div>
                  <div>
                    <span className="text-green-400">{stat.wins}V</span>
                    {' / '}
                    <span className="text-red-400">{stat.losses}D</span>
                  </div>
                </div>
              </div>
            ))}

            {sortedStats.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No se encontraron campeones
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
