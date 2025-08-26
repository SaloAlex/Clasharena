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
import { DateTimePicker, DateTimePickerProps } from '@/components/ui/date-time-picker';
import { toast } from 'sonner';
import { Trophy, Calendar, Medal, Settings, Gamepad2, Gift, Scroll } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// NUEVO: tipo para scoring que enviaremos al backend
interface ScoringRules {
  pointsForWin: number;
  pointsForLoss: number;
  firstBloodBonus: number;
  firstTowerBonus: number;
  perfectGameBonus: number;
  bonusPerKill: number;         // NUEVO
  bonusPerAssist: number;       // NUEVO
  capPerMatch: number;          // NUEVO (0 = sin tope)
  ignoreRemakesUnderSeconds: number; // NUEVO (ej: 300 = ignora < 5 min)
}

interface QueueConfig {
  enabled: boolean;
  pointMultiplier: number;
  id: number;
}

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
  bonusPerKill: number;                // NUEVO
  bonusPerAssist: number;              // NUEVO
  capPerMatch: number;                 // NUEVO
  ignoreRemakesUnderSeconds: number;   // NUEVO
  queues: {
    ranked_solo: QueueConfig;
    ranked_flex: QueueConfig;
    normal_draft: QueueConfig;
    normal_blind: QueueConfig;
    aram: QueueConfig;
  };
  customRules: string;
  prizes: {
    first: string;
    second: string;
    third: string;
  };
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
    minRank: 'NONE',
    maxRank: 'NONE',
    maxGamesPerDay: 0,
    bonusPerKill: 0,                // NUEVO
    bonusPerAssist: 0,              // NUEVO
    capPerMatch: 0,                 // NUEVO (0 = sin tope)
    ignoreRemakesUnderSeconds: 300, // NUEVO (recomendado 300s)
    queues: {
      ranked_solo: { enabled: true, pointMultiplier: 1.0, id: 420 },
      ranked_flex: { enabled: true, pointMultiplier: 0.8, id: 440 },
      normal_draft: { enabled: false, pointMultiplier: 0.6, id: 400 },
      normal_blind: { enabled: false, pointMultiplier: 0.5, id: 430 },
      aram: { enabled: false, pointMultiplier: 0.4, id: 450 }
    },
    customRules: '',
    prizes: {
      first: '',
      second: '',
      third: ''
    }
  });

  // Redirección segura en efecto (no durante el render)
  useEffect(() => {
    if (user && user.email !== 'dvdsalomon6@gmail.com') {
      router.replace('/');
    }
  }, [user, router]);

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Evita parpadeo: si hay usuario y no es admin, no renderizamos el form
  if (user && user.email !== 'dvdsalomon6@gmail.com') return null;

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    // Validar título y descripción
    if (formData.title.trim().length < 3) {
      errors.title = 'El título debe tener al menos 3 caracteres';
    }
    if (formData.description.trim().length < 10) {
      errors.description = 'La descripción debe tener al menos 10 caracteres';
    }

    // Validar fechas
    const now = new Date();
    if (formData.startDate < now) {
      errors.startDate = 'La fecha de inicio debe ser futura';
    }
    if (formData.endDate <= formData.startDate) {
      errors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    // Validar puntos
    if (formData.pointsPerWin < 0) {
      errors.pointsPerWin = 'Los puntos por victoria no pueden ser negativos';
    }
    if (formData.pointsPerLoss < 0) {
      errors.pointsPerLoss = 'Los puntos por derrota no pueden ser negativos';
    }
    if (formData.pointsFirstBlood < 0) {
      errors.pointsFirstBlood = 'Los puntos por primera sangre no pueden ser negativos';
    }
    if (formData.pointsFirstTower < 0) {
      errors.pointsFirstTower = 'Los puntos por primera torre no pueden ser negativos';
    }
    if (formData.pointsPerfectGame < 0) {
      errors.pointsPerfectGame = 'Los puntos por partida perfecta no pueden ser negativos';
    }

    // Validar rangos
    const ranks = ['NONE', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER'];
    if (formData.minRank !== 'NONE' && formData.maxRank !== 'NONE') {
      const minRankIndex = ranks.indexOf(formData.minRank);
      const maxRankIndex = ranks.indexOf(formData.maxRank);
      if (minRankIndex > maxRankIndex) {
        errors.minRank = 'El rango mínimo no puede ser mayor que el máximo';
        errors.maxRank = 'El rango máximo no puede ser menor que el mínimo';
      }
    }

    // Validar partidas por día
    if (formData.maxGamesPerDay < 0) {
      errors.maxGamesPerDay = 'El límite de partidas no puede ser negativo';
    }

    // Validar nuevos campos de scoring
    if (formData.capPerMatch < 0) {
      errors.capPerMatch = 'El tope por partida no puede ser negativo';
    }
    if (formData.ignoreRemakesUnderSeconds < 0) {
      errors.ignoreRemakesUnderSeconds = 'El mínimo de remake no puede ser negativo';
    }
    if (formData.bonusPerKill < 0 || formData.bonusPerAssist < 0) {
      errors.bonus = 'Los bonus por kill/assist no pueden ser negativos';
    }

    // Validar que al menos una cola esté habilitada
    const hasEnabledQueue = Object.values(formData.queues).some(queue => queue.enabled);
    if (!hasEnabledQueue) {
      errors.queues = 'Debes habilitar al menos una cola de juego';
    }

    setFormErrors(errors);
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.entries(errors)
        .map(([field, message]) => `• ${message}`)
        .join('\n');
      toast.error(
        <div>
          <p className="font-bold mb-2">Por favor, corrige los siguientes errores:</p>
          <pre className="text-sm whitespace-pre-wrap">{errorMessages}</pre>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    setIsLoading(true);

    try {
      
      const enabledQueues = Object.values(formData.queues).filter(q => q.enabled);

      // Array de queueId habilitados (p. ej. [420, 440] o [450] para ARAM)
      const allowedQueueIds = enabledQueues.map(q => q.id);

      // Mapa de multiplicadores por queueId, por si decides aplicarlo en el backend
      const queueMultipliers = Object.values(formData.queues)
        .reduce<Record<number, number>>((acc, q) => {
          acc[q.id] = q.pointMultiplier;
          return acc;
        }, {});

      // Objeto de scoring compacto para el backend
      const scoring: ScoringRules = {
        pointsForWin: formData.pointsPerWin,
        pointsForLoss: formData.pointsPerLoss,
        firstBloodBonus: formData.pointsFirstBlood,
        firstTowerBonus: formData.pointsFirstTower,
        perfectGameBonus: formData.pointsPerfectGame,
        bonusPerKill: formData.bonusPerKill,
        bonusPerAssist: formData.bonusPerAssist,
        capPerMatch: formData.capPerMatch,
        ignoreRemakesUnderSeconds: formData.ignoreRemakesUnderSeconds,
      };

      const payload = {
        title: formData.title,
        description: formData.description,
        format: formData.format,
        start_at: formData.startDate.getTime(), // ms epoch
        end_at: formData.endDate.getTime(),     // ms epoch
        rankRestriction: { min: formData.minRank, max: formData.maxRank },
        maxGamesPerDay: formData.maxGamesPerDay,

        // Configuración de colas (IMPORTANTE para mostrar en el detalle)
        queues: formData.queues,

        // CLAVE PARA EL BACKEND:
        allowedQueueIds,      // <- aquí el backend filtra por match.info.queueId
        queueMultipliers,     // <- opcional: multiplicar puntos por cola

        // Reglas de puntuación
        scoring,

        // Mantén lo que ya mandabas si tu API lo necesita
        customRules: formData.customRules,
        prizes: formData.prizes,
      };

      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data || 'Error al crear el torneo');

      toast.success('¡Torneo creado exitosamente!');
      router.push(`/t/${data.id}`);
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
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) {
                      setFormErrors({ ...formErrors, title: '' });
                    }
                  }}
                  placeholder="Nombre del torneo"
                  className={cn(
                    "bg-slate-700 border-slate-600 text-white",
                    formErrors.title && "border-red-500"
                  )}
                  required
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>
                )}
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
                  <div className="space-y-1">
                    <DateTimePicker
                      value={formData.startDate}
                      onChange={(date: Date) => {
                        setFormData({ ...formData, startDate: date });
                        if (formErrors.startDate) {
                          setFormErrors({ ...formErrors, startDate: '' });
                        }
                      }}
                    />
                    {formErrors.startDate && (
                      <p className="text-sm text-red-500">{formErrors.startDate}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-white">Fecha de Fin</Label>
                  <div className="space-y-1">
                    <DateTimePicker
                      value={formData.endDate}
                      onChange={(date: Date) => {
                        setFormData({ ...formData, endDate: date });
                        if (formErrors.endDate) {
                          setFormErrors({ ...formErrors, endDate: '' });
                        }
                      }}
                    />
                    {formErrors.endDate && (
                      <p className="text-sm text-red-500">{formErrors.endDate}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colas de Juego */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Gamepad2 className="w-5 h-5 text-blue-500" />
                Colas de Juego
              </CardTitle>
              <CardDescription className="text-slate-400">
                Selecciona qué tipos de partida contarán para el torneo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(formData.queues).map(([queueKey, queueConfig]) => {
                const queueNames = {
                  ranked_solo: 'Ranked Solo/Duo',
                  ranked_flex: 'Ranked Flex',
                  normal_draft: 'Normal Draft',
                  normal_blind: 'Normal Blind Pick',
                  aram: 'ARAM'
                };
                
                return (
                  <div key={queueKey} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">{queueNames[queueKey as keyof typeof queueNames]}</Label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-400">
                          Multiplicador: {queueConfig.pointMultiplier}x puntos
                        </p>
                        <p className="text-xs text-slate-500">
                          (ID: {queueConfig.id})
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={queueConfig.enabled}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          queues: {
                            ...formData.queues,
                            [queueKey]: {
                              ...queueConfig,
                              enabled: checked
                            }
                          }
                        });
                      }}
                    />
                  </div>
                );
              })}
              
              {/* Mensaje aclaratorio */}
              <p className="text-xs text-slate-500 mt-4 p-3 bg-slate-700/30 rounded-lg">
                Sólo se contabilizarán partidas cuya cola (queueId) coincida con las colas habilitadas del torneo.
                Si el jugador juega en otro modo, esos puntos se ignorarán automáticamente.
              </p>
            </CardContent>
          </Card>

          {/* Sistema de Puntos */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Medal className="w-5 h-5 text-blue-500" />
                Sistema de Puntos
              </CardTitle>
              <CardDescription className="text-slate-400">Configura cómo se otorgan los puntos base</CardDescription>
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

          {/* Bonificaciones y límites */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Medal className="w-5 h-5 text-blue-500" />
                Bonificaciones y límites
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ajusta bonus y restricciones por partida
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Bonus por Kill</Label>
                <Input
                  type="number"
                  value={formData.bonusPerKill}
                  onChange={(e) => setFormData({ ...formData, bonusPerKill: parseFloat(e.target.value || '0') })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Bonus por Assist</Label>
                <Input
                  type="number"
                  value={formData.bonusPerAssist}
                  onChange={(e) => setFormData({ ...formData, bonusPerAssist: parseFloat(e.target.value || '0') })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Tope por Partida (0 = sin tope)</Label>
                <Input
                  type="number"
                  value={formData.capPerMatch}
                  onChange={(e) => setFormData({ ...formData, capPerMatch: parseInt(e.target.value || '0', 10) })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Ignorar remakes &lt;= (segundos)</Label>
                <Input
                  type="number"
                  value={formData.ignoreRemakesUnderSeconds}
                  onChange={(e) => setFormData({ ...formData, ignoreRemakesUnderSeconds: parseInt(e.target.value || '0', 10) })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
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
                  value={formData.maxGamesPerDay}
                  onChange={(e) => setFormData({ ...formData, maxGamesPerDay: parseInt(e.target.value || '0', 10) })}
                  placeholder="0 = Sin límite"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reglas Personalizadas */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Scroll className="w-5 h-5 text-blue-500" />
                Reglas Personalizadas
              </CardTitle>
              <CardDescription className="text-slate-400">
                Agrega reglas específicas para tu torneo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.customRules}
                onChange={(e) => setFormData({ ...formData, customRules: e.target.value })}
                placeholder="Ejemplo: No se permiten smurfs, las partidas deben ser transmitidas, etc..."
                className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Premios */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Gift className="w-5 h-5 text-blue-500" />
                Premios
              </CardTitle>
              <CardDescription className="text-slate-400">
                Define los premios para los ganadores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstPrize" className="text-white">Primer Lugar</Label>
                <Input
                  id="firstPrize"
                  value={formData.prizes.first}
                  onChange={(e) => setFormData({
                    ...formData,
                    prizes: { ...formData.prizes, first: e.target.value }
                  })}
                  placeholder="Premio para el primer lugar"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondPrize" className="text-white">Segundo Lugar</Label>
                <Input
                  id="secondPrize"
                  value={formData.prizes.second}
                  onChange={(e) => setFormData({
                    ...formData,
                    prizes: { ...formData.prizes, second: e.target.value }
                  })}
                  placeholder="Premio para el segundo lugar"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thirdPrize" className="text-white">Tercer Lugar</Label>
                <Input
                  id="thirdPrize"
                  value={formData.prizes.third}
                  onChange={(e) => setFormData({
                    ...formData,
                    prizes: { ...formData.prizes, third: e.target.value }
                  })}
                  placeholder="Premio para el tercer lugar"
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
