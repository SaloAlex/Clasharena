'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Trophy, Calendar, Users, Target, Clock, Star, UserPlus, ArrowLeft, Edit, Trash2, Gamepad2, Award, Zap, Shield, Crown, Users2, Timer, TrendingUp, BarChart3, Medal, Settings, Play, CheckCircle, XCircle } from 'lucide-react';
import { TournamentParticipants } from '@/components/TournamentParticipants';
import { TournamentLeaderboard } from '@/components/TournamentLeaderboard';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface QueueConfig {
  enabled: boolean;
  pointMultiplier: number;
  id: number;
}

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
  queues?: {
    ranked_solo?: QueueConfig;
    ranked_flex?: QueueConfig;
    normal_draft?: QueueConfig;
    normal_blind?: QueueConfig;
    aram?: QueueConfig;
  };
}

interface TournamentRegistration {
  id: string;
  tournament_id: string;
  user_id: string;
  summoner_name: string;
  summoner_id?: string;
  region: string;
  current_rank?: string;
  total_points: number;
  total_matches: number;
  status: string;
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

interface MatchRecord {
  id: string;
  match_id: string;
  queue_type: string;
  game_start: string;
  duration: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  champion_id: number;
  points_earned: number;
  points_breakdown: {
    reasons: string[];
    multiplier: number;
  };
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
  const [userMatches, setUserMatches] = useState<MatchRecord[]>([]);
  const supabase = createClientComponentClient();
  const [userRegistration, setUserRegistration] = useState<TournamentRegistration | null>(initialUserRegistration);
  
  // Auto-recuperación de usuario si llega null
  const [sessionUser, setSessionUser] = useState<User | null>(currentUser);

  useEffect(() => {
    if (!sessionUser) {
      supabase.auth.getUser().then(({ data }) => setSessionUser(data.user ?? null));
    }
  }, [sessionUser, supabase]);

  // Lógica de ownership mejorada
  const adminEmail = 'dvdsalomon6@gmail.com';
  const userForCheck = sessionUser || currentUser;
  
  const isOwner = !!userForCheck && 
    (userForCheck.id === tournament.creator_id || userForCheck.email === adminEmail);

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
  
  // Formatear la duración del torneo en español
  const formatTournamentDuration = () => {
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
  }, [tournament.id, currentUser, supabase]);

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
    // Determinar el estado basado en las fechas
    const now = new Date();
    const startDate = new Date(tournament.start_at);
    const endDate = new Date(tournament.end_at);

    let currentStatus = 'unknown';
    
    if (tournament.status === 'cancelled') {
      currentStatus = 'cancelled';
    } else if (now < startDate) {
      currentStatus = 'upcoming';
    } else if (now >= startDate && now <= endDate) {
      currentStatus = 'active';
    } else if (now > endDate) {
      currentStatus = 'completed';
    }

    const statusColors: Record<string, string> = {
      'unknown': 'bg-slate-500/20 text-slate-300',
      'upcoming': 'bg-blue-500/20 text-blue-300',
      'active': 'bg-green-500/20 text-green-300',
      'completed': 'bg-purple-500/20 text-purple-300',
      'cancelled': 'bg-red-500/20 text-red-300'
    };

    const statusLabels: Record<string, string> = {
      'unknown': 'Desconocido',
      'upcoming': 'Próximo',
      'active': 'Activo',
      'completed': 'Finalizado',
      'cancelled': 'Cancelado'
    };

    return (
      <Badge className={statusColors[currentStatus]}>
        {statusLabels[currentStatus]}
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

  const getFormatDescription = (format: string) => {
    const descriptions = {
      'duration': 'Torneo por tiempo limitado',
      'league': 'Clasificación por puntos acumulados',
      'elimination': 'Eliminación directa hasta el ganador',
      'mixed': 'Combinación de diferentes formatos'
    };
    return descriptions[format as keyof typeof descriptions] || 'Formato no especificado';
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'duration':
        return <Timer className="w-5 h-5 text-orange-400" />;
      case 'league':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'elimination':
        return <Target className="w-5 h-5 text-red-400" />;
      case 'mixed':
        return <Award className="w-5 h-5 text-purple-400" />;
      default:
        return <Trophy className="w-5 h-5 text-slate-400" />;
    }
  };

  // Función para cargar las partidas del usuario
  const loadUserMatches = useCallback(async () => {
    if (!userRegistration) return;

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/matches?registration_id=${userRegistration.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUserMatches(data.matches || []);
      }
    } catch (error) {
      console.error('Error cargando partidas:', error);
    }
  }, [tournament.id, userRegistration]);

  useEffect(() => {
    if (userRegistration) {
      loadUserMatches();
    }
  }, [userRegistration, loadUserMatches]);

  const getQueueTypeName = (queueType: string) => {
    const queueNames: Record<string, string> = {
      'ranked_solo': 'SoloQ',
      'ranked_flex': 'Flex',
      'normal_draft': 'Normal Draft',
      'normal_blind': 'Normal Blind',
      'aram': 'ARAM',
      'clash': 'Clash',
      'urf': 'URF',
      'one_for_all': 'One for All',
      'nexus_blitz': 'Nexus Blitz',
      'ultimate_spellbook': 'Ultimate Spellbook',
      'arena': 'Arena',
      'tutorial': 'Tutorial',
      'unknown': 'Desconocido'
    };
    return queueNames[queueType] || queueType;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getReasonsText = (reasons: string[]) => {
    const reasonNames: Record<string, string> = {
      'victoria': 'Victoria',
      'derrota': 'Derrota',
      'primera_sangre': 'Primera Sangre',
      'primera_torre': 'Primera Torre',
      'partida_perfecta': 'Partida Perfecta'
    };
    return reasons.map(reason => reasonNames[reason] || reason).join(', ');
  };

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/tournaments')}
          className="text-slate-400 hover:text-white hover:bg-slate-800/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Torneos
        </Button>
      </div>

      {/* Tournament Header - Enhanced */}
      <Card className="border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        
        <CardHeader className="relative">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <CardTitle className="text-4xl font-bold text-white mb-2 leading-tight">
                  {tournament.title}
                </CardTitle>
                <CardDescription className="text-lg text-slate-300 leading-relaxed">
                  {tournament.description || 'Sin descripción'}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-3">
                {getStatusBadge()}
                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/t/${tournament.id}/edit`);
                      }}
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Enhanced Tournament Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Timer className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Duración</p>
                  <p className="font-semibold text-white">
                    {!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) 
                      ? formatTournamentDuration()
                      : 'No disponible'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-green-500/30 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  {getFormatIcon(tournament.format)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400">Formato</p>
                  <p className="font-semibold text-white">{getFormatLabel(tournament.format)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {getFormatDescription(tournament.format)}
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Users2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Participantes</p>
                  <p className="font-semibold text-white">1</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-orange-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Estado</p>
                  <p className="font-semibold text-white">
                    {formatStatus()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Registration Status & Action */}
          {(canRegister || isParticipant) && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    {isParticipant ? (
                      <Crown className="w-6 h-6 text-blue-400" />
                    ) : (
                      <UserPlus className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-blue-300 mb-1">
                      {isParticipant ? '¡Estás registrado!' : 'Registro Abierto'}
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      {isParticipant 
                        ? 'Juega partidas para ganar puntos y subir en la clasificación. ¡Demuestra tu habilidad!'
                        : 'Únete a este torneo épico y comienza tu camino hacia la victoria'
                      }
                    </p>
                  </div>
                </div>
                {canRegister && (
                  <Button 
                    onClick={handleRegistration}
                    disabled={isRegistering}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
                  >
                    {isRegistering ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Unirse al Torneo
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Lista de Participantes */}
          <TournamentParticipants tournamentId={tournament.id} />
        </CardContent>
      </Card>

      {/* Sección de Partidas del Usuario */}
      {userRegistration && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Play className="h-5 w-5" />
              Mis Partidas en el Torneo
            </CardTitle>
            <CardDescription>
              Partidas procesadas y puntos acumulados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{userRegistration.total_points}</div>
                <div className="text-sm text-gray-600">Puntos Totales</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{userRegistration.total_matches}</div>
                <div className="text-sm text-gray-600">Partidas Jugadas</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {userRegistration.total_matches > 0 
                    ? Math.round(userRegistration.total_points / userRegistration.total_matches) 
                    : 0}
                </div>
                <div className="text-sm text-gray-600">Promedio por Partida</div>
              </div>
            </div>

            {userMatches.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Historial de Partidas</h4>
                {userMatches.map((match) => (
                  <div key={match.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {match.win ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">
                            {getQueueTypeName(match.queue_type)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(match.game_start).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })} • {formatDuration(match.duration)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          +{match.points_earned} pts
                        </div>
                        <div className="text-xs text-gray-500">
                          {getReasonsText(match.points_breakdown.reasons)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>KDA: {match.kills}/{match.deaths}/{match.assists}</span>
                      <span>Campeón: {match.champion_id}</span>
                      {match.points_breakdown.multiplier !== 1 && (
                        <Badge variant="secondary" className="text-xs">
                          x{match.points_breakdown.multiplier}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay partidas procesadas aún</p>
                <p className="text-sm">Las partidas se procesan automáticamente cada cierto tiempo</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Enhanced Tournament Rules */}
        <Card className="border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xl font-semibold">Reglas y Puntuación</div>
                <div className="text-sm text-slate-400 font-normal">Sistema de puntos y modos de juego</div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 relative">
            {/* Daily Limit Section */}
            {tournament.max_games_per_day > 0 && (
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Timer className="w-4 h-4 text-orange-400" />
                  </div>
                  <h4 className="font-semibold text-white">Límite Diario</h4>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Máximo partidas por día</span>
                  <Badge variant="outline" className="text-orange-400 border-orange-400">
                    {tournament.max_games_per_day}
                  </Badge>
                </div>
              </div>
            )}

            <Separator className="bg-slate-700" />

            {/* Tournament Format Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  {getFormatIcon(tournament.format)}
                </div>
                <h4 className="font-semibold text-white">Formato del Torneo</h4>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-white font-medium">{getFormatLabel(tournament.format)}</span>
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    {tournament.format.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {getFormatDescription(tournament.format)}
                </p>
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* Game Modes Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4 text-green-400" />
                </div>
                <h4 className="font-semibold text-white">Modos de Juego</h4>
              </div>
              <p className="text-slate-300 mb-4 leading-relaxed">
                Los puntos ganados en cada modo se multiplican según su dificultad:
              </p>
              <div className="space-y-4">
                {(() => {
                  // Configuración por defecto si no hay queues configuradas
                  const defaultQueues = {
                    ranked_solo: { enabled: true, pointMultiplier: 1.0 },
                    ranked_flex: { enabled: true, pointMultiplier: 0.8 }
                  };

                  const queues = tournament.queues || defaultQueues;
                  const queueNames = {
                    ranked_solo: 'Ranked Solo/Duo',
                    ranked_flex: 'Ranked Flex',
                    normal_draft: 'Normal Draft',
                    normal_blind: 'Normal Blind Pick',
                    aram: 'ARAM'
                  };

                  const queueIcons = {
                    ranked_solo: <Crown className="w-4 h-4 text-yellow-400" />,
                    ranked_flex: <Users2 className="w-4 h-4 text-blue-400" />,
                    normal_draft: <Gamepad2 className="w-4 h-4 text-green-400" />,
                    normal_blind: <Gamepad2 className="w-4 h-4 text-slate-400" />,
                    aram: <Zap className="w-4 h-4 text-purple-400" />
                  };

                  const enabledQueues = Object.entries(queues).filter(([key, config]: [string, any]) => config?.enabled);

                  if (enabledQueues.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <Gamepad2 className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                        <p>No hay modos de juego configurados para este torneo.</p>
                      </div>
                    );
                  }

                  return enabledQueues.map(([key, config]: [string, any]) => {
                    const name = queueNames[key as keyof typeof queueNames] || key;
                    const multiplier = config.pointMultiplier || 1;
                    const icon = queueIcons[key as keyof typeof queueIcons] || <Gamepad2 className="w-4 h-4 text-green-400" />;
                    
                    // Valores por defecto para los puntos si no están configurados
                    const defaultPoints = {
                      points_per_win: 10,
                      points_per_loss: 5,
                      points_first_blood: 2,
                      points_first_tower: 2,
                      points_perfect_game: 5
                    };

                    const points = {
                      victoria: Math.round((tournament.points_per_win ?? defaultPoints.points_per_win) * multiplier),
                      derrota: Math.round((tournament.points_per_loss ?? defaultPoints.points_per_loss) * multiplier),
                      firstBlood: Math.round((tournament.points_first_blood ?? defaultPoints.points_first_blood) * multiplier),
                      firstTower: Math.round((tournament.points_first_tower ?? defaultPoints.points_first_tower) * multiplier),
                      perfectGame: Math.round((tournament.points_perfect_game ?? defaultPoints.points_perfect_game) * multiplier)
                    };
                    
                    return (
                      <div key={key} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-green-500/30 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            {icon}
                            <span className="text-white font-semibold">{name}</span>
                          </div>
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            Multiplicador x{multiplier}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Victoria</span>
                            <span className="text-green-400 font-medium">+{points.victoria}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Derrota</span>
                            <span className="text-red-400 font-medium">+{points.derrota}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Primera Sangre</span>
                            <span className="text-blue-400 font-medium">+{points.firstBlood}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Primera Torre</span>
                            <span className="text-blue-400 font-medium">+{points.firstTower}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Partida Perfecta</span>
                            <span className="text-purple-400 font-medium">+{points.perfectGame}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 italic">
                            Victoria + 0 muertes + 0 torres perdidas
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* Rank Restrictions Section */}
            {(tournament.min_rank !== 'NONE' || tournament.max_rank !== 'NONE') && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-white">Restricciones de Rango</h4>
                </div>
                <div className="space-y-3">
                  {tournament.min_rank !== 'NONE' && (
                    <div className="flex justify-between items-center bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      <span className="text-slate-300">Rango Mínimo</span>
                      <Badge variant="outline" className="text-purple-400 border-purple-400">
                        {tournament.min_rank}
                      </Badge>
                    </div>
                  )}
                  {tournament.max_rank !== 'NONE' && (
                    <div className="flex justify-between items-center bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                      <span className="text-slate-300">Rango Máximo</span>
                      <Badge variant="outline" className="text-purple-400 border-purple-400">
                        {tournament.max_rank}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Tournament Leaderboard */}
        <Card className="border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
          
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-xl font-semibold">Clasificación</div>
                <div className="text-sm text-slate-400 font-normal">Ranking de participantes</div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative">
            <TournamentLeaderboard tournamentId={tournament.id} showCompleteButton={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}