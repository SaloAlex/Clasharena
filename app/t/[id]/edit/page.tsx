'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Trophy, Calendar, Medal, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface TournamentFormData {
  title: string;
  description: string;
  format: 'duration' | 'league' | 'elimination' | 'mixed';
  startDate: Date;
  endDate: Date;
  pointsPerWin: number;
  pointsPerLoss: number;
  pointsFirstBlood: number;
  pointsFirstTower: number;
  pointsPerfectGame: number;
  minRank: string;
  maxRank: string;
  maxGamesPerDay: number;
}

export default function EditTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<TournamentFormData>({
    title: '',
    description: '',
    format: 'duration',
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    pointsPerWin: 100,
    pointsPerLoss: 0,
    pointsFirstBlood: 10,
    pointsFirstTower: 20,
    pointsPerfectGame: 50,
    minRank: 'NONE',
    maxRank: 'NONE',
    maxGamesPerDay: 0
  });

  useEffect(() => {
    if (!user) return;
    loadTournament();
  }, [params.id, user]);

  const loadTournament = async () => {
    try {
      console.log('Current user:', user);
      
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      if (!tournament) throw new Error('Torneo no encontrado');

      console.log('Tournament:', tournament);
      console.log('Creator ID:', tournament.creator_id);
      console.log('User ID:', user?.id);

      // Verificar que el usuario sea el creador
      if (!user || tournament.creator_id !== user.id) {
        console.log('Permission denied - IDs do not match');
        toast.error('No tienes permiso para editar este torneo');
        router.push('/tournaments');
        return;
      }

      // Verificar si el torneo ya comenzó
      const now = new Date();
      const tournamentStart = new Date(tournament.start_date);
      const tournamentEnd = new Date(tournament.end_date);

      // Si el torneo ya comenzó, no permitir cambiar la fecha de inicio
      if (tournamentStart < now) {
        toast.warning('El torneo ya comenzó. No se puede modificar la fecha de inicio.');
      }

      setFormData({
        title: tournament.title,
        description: tournament.description,
        format: tournament.format as any,
        startDate: tournamentStart,
        endDate: tournamentEnd,
        pointsPerWin: tournament.points_per_win,
        pointsPerLoss: tournament.points_per_loss,
        pointsFirstBlood: tournament.points_first_blood,
        pointsFirstTower: tournament.points_first_tower,
        pointsPerfectGame: tournament.points_perfect_game,
        minRank: tournament.min_rank,
        maxRank: tournament.max_rank,
        maxGamesPerDay: tournament.max_games_per_day
      });
    } catch (error: any) {
      toast.error(error.message);
      router.push('/tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar fechas
    const now = new Date();
    const originalStartDate = new Date(formData.startDate);
    
    // Si el torneo ya comenzó, no permitir cambiar la fecha de inicio a una fecha futura
    if (originalStartDate < now && formData.startDate > originalStartDate) {
      toast.error('No se puede modificar la fecha de inicio de un torneo que ya comenzó');
      return;
    }

    // Validar que la fecha de fin sea posterior a la de inicio
    if (formData.endDate <= formData.startDate) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          title: formData.title,
          description: formData.description,
          format: formData.format,
          start_date: formData.startDate.toISOString(),
          end_date: formData.endDate.toISOString(),
          points_per_win: formData.pointsPerWin,
          points_per_loss: formData.pointsPerLoss,
          points_first_blood: formData.pointsFirstBlood,
          points_first_tower: formData.pointsFirstTower,
          points_perfect_game: formData.pointsPerfectGame,
          min_rank: formData.minRank,
          max_rank: formData.maxRank,
          max_games_per_day: formData.maxGamesPerDay
        })
        .eq('id', params.id)
        .eq('creator_id', user?.id);

      if (error) throw error;

      toast.success('¡Torneo actualizado exitosamente!');
      router.push(`/t/${params.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-800/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Trophy className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Editar Torneo</h1>
          <p className="text-slate-400">Modifica los detalles de tu torneo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5 text-blue-500" />
                Información del Torneo
              </CardTitle>
              <CardDescription className="text-slate-400">Detalles básicos del torneo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nombre del torneo"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe tu torneo..."
                  className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format" className="text-white">Formato</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value: 'duration' | 'league' | 'elimination' | 'mixed') =>
                    setFormData({ ...formData, format: value })
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecciona un formato" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="duration" className="text-white">Por Duración</SelectItem>
                    <SelectItem value="league" className="text-white">Liga</SelectItem>
                    <SelectItem value="elimination" className="text-white">Eliminación Directa</SelectItem>
                    <SelectItem value="mixed" className="text-white">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-blue-500" />
                Fechas del Torneo
              </CardTitle>
              <CardDescription className="text-slate-400">Define cuándo comienza y termina el torneo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-white">Fecha de Inicio</Label>
                  <DateTimePicker
                    value={formData.startDate}
                    onChange={(date: Date) => setFormData({ ...formData, startDate: date })}
                    disabled={formData.startDate < new Date()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-white">Fecha de Fin</Label>
                  <DateTimePicker
                    value={formData.endDate}
                    onChange={(date: Date) => setFormData({ ...formData, endDate: date })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sistema de Puntos */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Medal className="w-5 h-5 text-blue-500" />
                Sistema de Puntos
              </CardTitle>
              <CardDescription className="text-slate-400">Configura cómo se otorgan los puntos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsPerWin" className="text-white">Puntos por Victoria</Label>
                  <Input
                    id="pointsPerWin"
                    type="number"
                    value={formData.pointsPerWin}
                    onChange={(e) => setFormData({ ...formData, pointsPerWin: parseInt(e.target.value || '0', 10) })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsPerLoss" className="text-white">Puntos por Derrota</Label>
                  <Input
                    id="pointsPerLoss"
                    type="number"
                    value={formData.pointsPerLoss}
                    onChange={(e) => setFormData({ ...formData, pointsPerLoss: parseInt(e.target.value || '0', 10) })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsFirstBlood" className="text-white">First Blood</Label>
                  <Input
                    id="pointsFirstBlood"
                    type="number"
                    value={formData.pointsFirstBlood}
                    onChange={(e) => setFormData({ ...formData, pointsFirstBlood: parseInt(e.target.value || '0', 10) })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsFirstTower" className="text-white">Primera Torre</Label>
                  <Input
                    id="pointsFirstTower"
                    type="number"
                    value={formData.pointsFirstTower}
                    onChange={(e) => setFormData({ ...formData, pointsFirstTower: parseInt(e.target.value || '0', 10) })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsPerfectGame" className="text-white">Partida Perfecta</Label>
                  <Input
                    id="pointsPerfectGame"
                    type="number"
                    value={formData.pointsPerfectGame}
                    onChange={(e) => setFormData({ ...formData, pointsPerfectGame: parseInt(e.target.value || '0', 10) })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restricciones */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5 text-blue-500" />
                Restricciones
              </CardTitle>
              <CardDescription className="text-slate-400">Establece límites y requisitos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minRank" className="text-white">Rango Mínimo</Label>
                  <Select
                    value={formData.minRank}
                    onValueChange={(value) => setFormData({ ...formData, minRank: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Sin mínimo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="NONE" className="text-white">Sin mínimo</SelectItem>
                      <SelectItem value="IRON" className="text-white">Hierro</SelectItem>
                      <SelectItem value="BRONZE" className="text-white">Bronce</SelectItem>
                      <SelectItem value="SILVER" className="text-white">Plata</SelectItem>
                      <SelectItem value="GOLD" className="text-white">Oro</SelectItem>
                      <SelectItem value="PLATINUM" className="text-white">Platino</SelectItem>
                      <SelectItem value="EMERALD" className="text-white">Esmeralda</SelectItem>
                      <SelectItem value="DIAMOND" className="text-white">Diamante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRank" className="text-white">Rango Máximo</Label>
                  <Select
                    value={formData.maxRank}
                    onValueChange={(value) => setFormData({ ...formData, maxRank: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Sin máximo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="NONE" className="text-white">Sin máximo</SelectItem>
                      <SelectItem value="BRONZE" className="text-white">Bronce</SelectItem>
                      <SelectItem value="SILVER" className="text-white">Plata</SelectItem>
                      <SelectItem value="GOLD" className="text-white">Oro</SelectItem>
                      <SelectItem value="PLATINUM" className="text-white">Platino</SelectItem>
                      <SelectItem value="EMERALD" className="text-white">Esmeralda</SelectItem>
                      <SelectItem value="DIAMOND" className="text-white">Diamante</SelectItem>
                      <SelectItem value="MASTER" className="text-white">Maestro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxGamesPerDay" className="text-white">Máximo de Partidas por Día</Label>
                <Input
                  id="maxGamesPerDay"
                  type="number"
                  value={formData.maxGamesPerDay || ''}
                  onChange={(e) => setFormData({ ...formData, maxGamesPerDay: e.target.value ? parseInt(e.target.value, 10) : 0 })}
                  placeholder="0 = Sin límite"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
