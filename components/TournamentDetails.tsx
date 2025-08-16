'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { Trophy, Calendar, Users, Target, Clock, Star, UserPlus } from 'lucide-react';
import { TournamentParticipants } from '@/components/TournamentParticipants';
import { TournamentLeaderboard } from '@/components/TournamentLeaderboard';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Tournament {
  id: string;
  title: string;
  description: string;
  format: string;
  status: string;
  start_at: string;
  end_at: string;
  creator_id: string;
  points_per_win: number;
  points_per_loss: number;
  points_first_blood: number;
  points_first_tower: number;
  points_perfect_game: number;
  min_rank: string;
  max_rank: string;
  max_games_per_day: number;
}

interface TournamentRegistration {
  id: string;
  tournament_id: string;
  user_id: string;
  created_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  points: number;
  games_played: number;
  wins: number;
  losses: number;
  last_match_at: string | null;
}

interface TournamentDetailsProps {
  tournament: Tournament;
  userRegistration: TournamentRegistration | null;
  leaderboard: LeaderboardEntry[];
  currentUser: User | null;
}

export function TournamentDetails({ 
  tournament, 
  userRegistration: initialUserRegistration, 
  leaderboard, 
  currentUser 
}: TournamentDetailsProps) {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClientComponentClient();
  const [userRegistration, setUserRegistration] = useState<TournamentRegistration | null>(initialUserRegistration);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar el torneo');
      }

      toast.success('Torneo eliminado exitosamente');
      router.push('/tournaments');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };
  const now = new Date();
  const startDate = tournament.start_at ? new Date(tournament.start_at) : now;
  const endDate = tournament.end_at ? new Date(tournament.end_at) : now;
  
  // Formatear la duración en español
  const formatDuration = () => {
    const hours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    if (hours === 24) return '24 horas';
    if (hours < 24) return `${hours} horas`;
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'día' : 'días'}`;
  };

  // Formatear el estado en español
  const formatStatus = () => {
    // Si el torneo está activo, mostrar cuándo comenzó
    if (now >= startDate && now <= endDate) {
      const minutesAgo = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60));
      if (minutesAgo <= 1) return 'Comenzó hace menos de un minuto';
      if (minutesAgo < 60) return `Comenzó hace ${minutesAgo} minutos`;
      const hoursAgo = Math.floor(minutesAgo / 60);
      if (hoursAgo < 24) return `Comenzó hace ${hoursAgo} ${hoursAgo === 1 ? 'hora' : 'horas'}`;
      const daysAgo = Math.floor(hoursAgo / 24);
      return `Comenzó hace ${daysAgo} ${daysAgo === 1 ? 'día' : 'días'}`;
    }
    
    // Si el torneo no ha comenzado
    if (now < startDate) {
      const minutesToStart = Math.round((startDate.getTime() - now.getTime()) / (1000 * 60));
      if (minutesToStart <= 1) return 'Comienza en menos de un minuto';
      if (minutesToStart < 60) return `Comienza en ${minutesToStart} minutos`;
      const hoursToStart = Math.floor(minutesToStart / 60);
      if (hoursToStart < 24) return `Comienza en ${hoursToStart} ${hoursToStart === 1 ? 'hora' : 'horas'}`;
      const daysToStart = Math.floor(hoursToStart / 24);
      return `Comienza en ${daysToStart} ${daysToStart === 1 ? 'día' : 'días'}`;
    }
    
    // Si el torneo ya terminó
    if (now > endDate) {
      return 'Finalizado';
    }

    // Estados específicos
    switch (tournament.status) {
      case 'active': return 'En curso';
      case 'finished': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      default: return 'Estado no disponible';
    }
  };

  const isActive = tournament.status === 'active' && 
    !isNaN(startDate.getTime()) && 
    !isNaN(endDate.getTime()) && 
    now >= startDate && 
    now <= endDate;
  // Verificar si el usuario actual está en la lista de participantes
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    const checkParticipation = async () => {
      if (!currentUser) return;

      const { data } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('tournament_id', tournament.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      setIsParticipant(!!data);
    };

    checkParticipation();
  }, [tournament.id, currentUser?.id]);

  const canRegister = currentUser && !isParticipant && 
    (tournament.status === 'upcoming' || tournament.status === 'active') &&
    now <= endDate;



  const handleRegistration = async () => {
    if (!currentUser) {
      toast.error('Por favor, inicia sesión para registrarte en torneos');
      return;
    }

    setIsRegistering(true);
    
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/register`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al registrarse');
      }

      const result = await response.json();
      toast.success(result.message || '¡Registrado exitosamente en el torneo!');
      
      // Actualizar el estado local
      setIsParticipant(true);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const getStatusBadge = () => {
    const statusColors = {
      'draft': 'bg-slate-500/20 text-slate-300',
      'upcoming': 'bg-blue-500/20 text-blue-300',
      'active': 'bg-green-500/20 text-green-300',
      'completed': 'bg-purple-500/20 text-purple-300',
      'cancelled': 'bg-red-500/20 text-red-300'
    };

    return (
      <Badge className={statusColors[tournament.status as keyof typeof statusColors] || statusColors.draft}>
        {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
      </Badge>
    );
  };

  const getFormatLabel = (format: string) => {
    const formats = {
      'duration': 'Por Duración',
      'league': 'Liga',
      'elimination': 'Eliminación Directa',
      'mixed': 'Mixto'
    };
    return formats[format as keyof typeof formats] || format;
  };

  return (
    <div className="space-y-8">
      {/* Tournament Header */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <CardTitle className="text-3xl text-white">{tournament.title}</CardTitle>
                <CardDescription className="text-lg mt-1 text-slate-400">
                  {tournament.description || 'Sin descripción'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUser && currentUser.id === tournament.creator_id && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/t/${tournament.id}/edit`);
                    }}
                  >
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border border-slate-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">¿Eliminar torneo?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          Esta acción no se puede deshacer. Se eliminarán todos los datos del torneo,
                          incluyendo registros de participantes y puntuaciones.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel 
                          className="bg-slate-800 text-white hover:bg-slate-700 border-slate-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                          }}
                        >
                          {isDeleting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Eliminando...
                            </>
                          ) : (
                            'Eliminar Torneo'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tournament Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Duración</p>
                <p className="font-medium text-white">
                  {!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) 
                    ? formatDuration()
                    : 'Duración no disponible'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Trophy className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Formato</p>
                <p className="font-medium text-white">{getFormatLabel(tournament.format)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">Participantes</p>
                <p className="font-medium text-white">1</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Estado</p>
                <p className="font-medium text-white">
                  {formatStatus()}
                </p>
              </div>
            </div>
          </div>

          {/* Registration Status & Action */}
          <div className="space-y-6">
            {(canRegister || isParticipant) && (
              <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div>
                  <h3 className="font-medium text-blue-300">
                    {isParticipant ? '¡Estás registrado!' : 'Registro Abierto'}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {isParticipant 
                      ? 'Juega partidas para ganar puntos y subir en la clasificación'
                      : 'Únete a este torneo y comienza a competir'
                    }
                  </p>
                </div>
                {canRegister && (
                  <Button 
                    onClick={handleRegistration}
                    disabled={isRegistering}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isRegistering ? (
                      'Registrando...'
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Unirse al Torneo
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Lista de Participantes */}
            <TournamentParticipants tournamentId={tournament.id} />
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Tournament Rules */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="w-5 h-5 text-blue-500" />
              Reglas y Puntuación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 text-white">Sistema de Puntos</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Victoria</span>
                  <span className="text-green-400">+{tournament.points_per_win} puntos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Derrota</span>
                  <span className="text-red-400">+{tournament.points_per_loss} puntos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primera Sangre</span>
                  <span className="text-blue-400">+{tournament.points_first_blood} puntos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primera Torre</span>
                  <span className="text-blue-400">+{tournament.points_first_tower} puntos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Partida Perfecta</span>
                  <span className="text-purple-400">+{tournament.points_perfect_game} puntos</span>
                </div>
                {tournament.max_games_per_day > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Máx. partidas por día</span>
                    <span className="text-white">{tournament.max_games_per_day}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-slate-700" />

            <div>
              <h4 className="font-medium mb-2 text-white">Restricciones de Rango</h4>
              <div className="space-y-2 text-sm">
                {tournament.min_rank !== 'NONE' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rango Mínimo</span>
                    <span className="text-white">{tournament.min_rank}</span>
                  </div>
                )}
                {tournament.max_rank !== 'NONE' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rango Máximo</span>
                    <span className="text-white">{tournament.max_rank}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tournament Leaderboard */}
        <TournamentLeaderboard tournamentId={tournament.id} showCompleteButton={true} />
      </div>
    </div>
  );
}