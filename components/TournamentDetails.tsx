'use client';

import { useState } from 'react';
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
import { Trophy, Calendar, Users, Target, Clock, Star } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

interface Tournament {
  id: string;
  title: string;
  description: string;
  format: string;
  status: string;
  start_date: string;
  end_date: string;
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
  userRegistration, 
  leaderboard, 
  currentUser 
}: TournamentDetailsProps) {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const startDate = tournament.start_date ? new Date(tournament.start_date) : now;
  const endDate = tournament.end_date ? new Date(tournament.end_date) : now;
  const isActive = tournament.status === 'active' && 
    !isNaN(startDate.getTime()) && 
    !isNaN(endDate.getTime()) && 
    now >= startDate && 
    now <= endDate;
  const canRegister = isActive && !userRegistration && currentUser;

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

      toast.success('¡Registrado exitosamente en el torneo!');
      const { data: registrationData } = await fetch(`/api/tournaments/${tournament.id}/register/${currentUser.id}`).then(res => res.json());
      if (registrationData) {
        setUserRegistration(registrationData);
        router.refresh();
      }
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
                    ? formatDistance(startDate, endDate)
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
                <p className="font-medium text-white">{leaderboard.length}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Estado</p>
                <p className="font-medium text-white">
                  {isActive && !isNaN(endDate.getTime())
                    ? `Termina ${formatDistance(endDate, now, { addSuffix: true })}` 
                    : tournament.status === 'upcoming' && !isNaN(startDate.getTime())
                      ? `Comienza ${formatDistance(startDate, now, { addSuffix: true })}`
                      : tournament.status === 'completed'
                        ? 'Finalizado'
                        : 'Estado no disponible'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Registration Status & Action */}
          {isActive && (
            <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div>
                <h3 className="font-medium text-blue-300">
                  {userRegistration ? '¡Estás registrado!' : 'Registro Abierto'}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {userRegistration 
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
                  {isRegistering ? 'Registrando...' : 'Unirse al Torneo'}
                </Button>
              )}
            </div>
          )}
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

        {/* Mini Leaderboard */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Star className="w-5 h-5 text-yellow-500" />
                Clasificación
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/t/${tournament.id}/leaderboard`}>
                  Ver Completa
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div key={entry.user_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-slate-600 text-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          {entry.user_id}
                        </span>
                        <span className="text-xs text-slate-400">
                          {entry.wins}V - {entry.losses}D • {entry.games_played} partidas
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-400">
                        {entry.points} pts
                      </span>
                      {entry.last_match_at && (
                        <div className="text-xs text-slate-400">
                          Última partida: {entry.last_match_at && !isNaN(new Date(entry.last_match_at).getTime()) 
                            ? formatDistance(new Date(entry.last_match_at), now, { addSuffix: true })
                            : 'fecha no disponible'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-4">
                No hay participantes aún
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}