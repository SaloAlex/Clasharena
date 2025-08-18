'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Swords, Target, Clock } from 'lucide-react';

interface PlayerStatsProps {
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    averageKDA: string;
    averageCS: number;
    averageDuration: number;
    mostPlayedChampion: string;
    mostPlayedRole: string;
  };
}

export function PlayerStats({ stats }: PlayerStatsProps) {
  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Estadísticas Generales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <div className="text-sm text-slate-400">Campeón más jugado</div>
            <div className="text-lg font-medium text-white">{stats.mostPlayedChampion}</div>
          </div>
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <div className="text-sm text-slate-400">Rol más jugado</div>
            <div className="text-lg font-medium text-white">{stats.mostPlayedRole}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
