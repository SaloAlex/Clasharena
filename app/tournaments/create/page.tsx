'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { toast } from 'sonner';
import { Trophy, Calendar, Medal, Settings } from 'lucide-react';

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

export default function CreateTournamentPage() {
  const router = useRouter();
  const { user } = useAuth(); // <- hook siempre arriba

  const [isLoading, setIsLoading] = useState(false);
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
    minRank: '',
    maxRank: '',
    maxGamesPerDay: 0
  });

  // Redirección segura en efecto (no durante el render)
  useEffect(() => {
    if (user && user.email !== 'dvdsalomon6@gmail.com') {
      router.replace('/tournaments');
    }
  }, [user, router]);

  // Evita parpadeo: si hay usuario y no es admin, no renderizamos el form
  if (user && user.email !== 'dvdsalomon6@gmail.com') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al crear el torneo');

      toast.success('¡Torneo creado exitosamente!');
      router.push(`/tournaments/${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-white mb-2">Crear Nuevo Torneo</h1>
          <p className="text-slate-400">Configura los detalles de tu torneo</p>
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
                      <SelectItem value="" className="text-white">Sin mínimo</SelectItem>
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
                      <SelectItem value="" className="text-white">Sin máximo</SelectItem>
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
                  value={formData.maxGamesPerDay}
                  onChange={(e) => setFormData({ ...formData, maxGamesPerDay: parseInt(e.target.value || '0', 10) })}
                  placeholder="0 = Sin límite"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botón de Submit */}
          <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creando Torneo...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                Crear Torneo
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
