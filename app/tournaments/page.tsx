'use client';

/* eslint-disable jsx-a11y/label-has-associated-control */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Trophy, Calendar, Users, ArrowRight, RefreshCw, Clock, Star, Zap, Filter, Search, Grid, List, ChevronDown, X, Gamepad2, Target, Timer, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Tournament {
  id: string;
  title: string;
  description: string;
  format: string;
  status: string;
  start_at: string;
  end_at: string;
  creator_id: string;
  participant_count?: number;
}

export default function TournamentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [gameModeFilter, setGameModeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const loadTournaments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      }
      
      const response = await fetch('/api/tournaments');
      const data = await response.json();

      if (!response.ok) {
        switch (response.status) {
          case 401:
            router.replace('/auth');
            return;
          case 403:
            toast.error('No tienes permisos para ver los torneos');
            return;
          default:
            throw new Error(data.error || 'Error al cargar torneos');
        }
      }

      if (!Array.isArray(data)) {
        console.error('Datos recibidos:', data);
        throw new Error('Formato de datos inválido');
      }

      setTournaments(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  // Recargar torneos cuando se regrese a esta página
  useEffect(() => {
    const handleFocus = () => {
      loadTournaments();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadTournaments]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getStatusLabel = (status: string) => {
    const statuses = {
      'draft': 'Borrador',
      'upcoming': 'Próximo',
      'active': 'En Curso',
      'completed': 'Completado',
      'cancelled': 'Cancelado'
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      'upcoming': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'active': 'bg-green-500/20 text-green-300 border-green-500/30',
      'completed': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'cancelled': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status as keyof typeof colors] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'draft': Clock,
      'upcoming': Calendar,
      'active': Zap,
      'completed': Trophy,
      'cancelled': Users
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  const getTimeUntilStart = (startDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `En ${days}d ${hours}h`;
    if (hours > 0) return `En ${hours}h`;
    return 'Pronto';
  };

  // Opciones de filtros con iconos y descripciones
  const statusOptions = [
    { value: 'all', label: 'Todos los estados', icon: Star, description: 'Ver todos los torneos' },
    { value: 'upcoming', label: 'Próximos', icon: Calendar, description: 'Torneos que van a comenzar' },
    { value: 'active', label: 'En Curso', icon: Zap, description: 'Torneos activos ahora' },
    { value: 'completed', label: 'Finalizados', icon: Trophy, description: 'Torneos ya terminados' }
  ];

  const formatOptions = [
    { value: 'all', label: 'Todos los formatos', icon: Gamepad2, description: 'Ver todos los tipos de torneo' },
    { value: 'league', label: 'Liga', icon: Target, description: 'Clasificación por puntos' },
    { value: 'elimination', label: 'Eliminación', icon: Users2, description: 'Eliminación directa' },
    { value: 'duration', label: 'Por Duración', icon: Timer, description: 'Torneos por tiempo' },
    { value: 'mixed', label: 'Mixto', icon: Trophy, description: 'Combinación de formatos' }
  ];

  const gameModeOptions = [
    { value: 'all', label: 'Todos los modos', icon: Gamepad2, description: 'Ver todos los modos de juego' },
    { value: 'aram', label: 'ARAM', icon: Target, description: 'All Random All Mid' },
    { value: 'soloq', label: 'SoloQ', icon: Users, description: 'Ranked Solo/Duo' },
    { value: 'flex', label: 'Flex', icon: Users2, description: 'Ranked Flex' },
    { value: 'normal', label: 'Normal', icon: Gamepad2, description: 'Normal Draft/Blind' }
  ];

  // Función para actualizar filtros activos
  const updateActiveFilters = useCallback(() => {
    const filters = new Set<string>();
    if (statusFilter !== 'all') filters.add(`status:${statusFilter}`);
    if (formatFilter !== 'all') filters.add(`format:${formatFilter}`);
    if (gameModeFilter !== 'all') filters.add(`gameMode:${gameModeFilter}`);
    if (searchTerm) filters.add(`search:${searchTerm}`);
    setActiveFilters(filters);
  }, [statusFilter, formatFilter, gameModeFilter, searchTerm]);

  useEffect(() => {
    updateActiveFilters();
  }, [updateActiveFilters]);

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setFormatFilter('all');
    setGameModeFilter('all');
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    const matchesFormat = formatFilter === 'all' || tournament.format === formatFilter;
    
    // Filtro por modo de juego (buscar en descripción y título)
    const matchesGameMode = gameModeFilter === 'all' || 
      tournament.title.toLowerCase().includes(gameModeFilter) ||
      tournament.description.toLowerCase().includes(gameModeFilter);
    
    return matchesSearch && matchesStatus && matchesFormat && matchesGameMode;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-slate-700/50 rounded-lg mb-2"></div>
              <div className="h-4 w-80 bg-slate-700/30 rounded-lg"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-32 bg-slate-700/50 rounded-lg animate-pulse"></div>
              <div className="h-10 w-40 bg-slate-700/50 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Filters Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="h-10 flex-1 bg-slate-700/50 rounded-lg"></div>
              <div className="h-10 w-40 bg-slate-700/50 rounded-lg"></div>
              <div className="h-10 w-24 bg-slate-700/50 rounded-lg"></div>
            </div>
          </div>

          {/* Tournament Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <Card className="border-slate-700/50 bg-slate-800/30 h-80">
                  <CardHeader className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="h-6 bg-slate-700/50 rounded-lg w-3/4"></div>
                        <div className="h-4 bg-slate-700/30 rounded-lg w-full"></div>
                        <div className="h-4 bg-slate-700/30 rounded-lg w-2/3"></div>
                      </div>
                      <div className="h-6 w-20 bg-slate-700/50 rounded-full"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-16 bg-slate-700/50 rounded"></div>
                      <div className="h-4 w-24 bg-slate-700/50 rounded"></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-20 bg-slate-700/50 rounded"></div>
                      <div className="h-4 w-28 bg-slate-700/50 rounded"></div>
                    </div>
                    <div className="h-9 w-full bg-slate-700/50 rounded-lg mt-4"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Torneos
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              Explora y participa en torneos épicos de League of Legends
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                {tournaments.length} torneos disponibles
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {tournaments.reduce((acc, t) => acc + (t.participant_count || 0), 0)} participantes
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button
              onClick={() => loadTournaments(true)}
              disabled={isRefreshing}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
            {user?.email === 'dvdsalomon6@gmail.com' && (
              <Button
                onClick={() => router.push('/tournaments/create')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Crear Torneo
            </Button>
          )}
        </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="🔍 Buscar torneos por nombre, descripción o modo de juego..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 transition-all duration-200 text-lg"
            />
          </div>

          {/* Filters Section */}
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-400" />
                Filtros de Búsqueda
              </h3>
              {activeFilters.size > 0 && (
                <Button
                  onClick={clearAllFilters}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpiar todo
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Estado del Torneo */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Estado del Torneo
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {statusOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value} className="text-white hover:bg-slate-700">
                          <div className="flex items-center gap-3 py-1">
                            <Icon className="w-4 h-4 text-blue-400" />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-slate-400">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Formato del Torneo */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  Formato del Torneo
                </Label>
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700">
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {formatOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value} className="text-white hover:bg-slate-700">
                          <div className="flex items-center gap-3 py-1">
                            <Icon className="w-4 h-4 text-purple-400" />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-slate-400">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Modo de Juego */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-green-400" />
                  Modo de Juego
                </Label>
                <Select value={gameModeFilter} onValueChange={setGameModeFilter}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700">
                    <SelectValue placeholder="Seleccionar modo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {gameModeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value} className="text-white hover:bg-slate-700">
                          <div className="flex items-center gap-3 py-1">
                            <Icon className="w-4 h-4 text-green-400" />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-slate-400">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Vista:</span>
                <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' 
                      ? 'bg-blue-600 text-white h-8 w-8 p-0' 
                      : 'text-slate-400 hover:text-white h-8 w-8 p-0'
                    }
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' 
                      ? 'bg-blue-600 text-white h-8 w-8 p-0' 
                      : 'text-slate-400 hover:text-white h-8 w-8 p-0'
                    }
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-slate-400">
                {filteredTournaments.length} torneo{filteredTournaments.length !== 1 ? 's' : ''} encontrado{filteredTournaments.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilters.size > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-slate-400">Filtros activos:</span>
              {Array.from(activeFilters).map((filter) => {
                const [type, value] = filter.split(':');
                let label = '';
                let color = 'border-slate-600 text-slate-300';
                
                if (type === 'search') {
                  label = `Búsqueda: "${value}"`;
                  color = 'border-blue-600 text-blue-300';
                } else if (type === 'status') {
                  label = `Estado: ${getStatusLabel(value)}`;
                  color = 'border-blue-600 text-blue-300';
                } else if (type === 'format') {
                  label = `Formato: ${getFormatLabel(value)}`;
                  color = 'border-purple-600 text-purple-300';
                } else if (type === 'gameMode') {
                  const gameMode = gameModeOptions.find(opt => opt.value === value);
                  label = `Modo: ${gameMode?.label || value}`;
                  color = 'border-green-600 text-green-300';
                }

                return (
                  <Badge 
                    key={filter} 
                    variant="outline" 
                    className={`text-xs ${color} flex items-center gap-1`}
                  >
                    {label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => {
                        if (type === 'search') setSearchTerm('');
                        else if (type === 'status') setStatusFilter('all');
                        else if (type === 'format') setFormatFilter('all');
                        else if (type === 'gameMode') setGameModeFilter('all');
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Tournament Grid/List */}
        {filteredTournaments.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredTournaments.map((tournament) => {
              const StatusIcon = getStatusIcon(tournament.status);
              const timeUntilStart = getTimeUntilStart(tournament.start_at);
              
              return viewMode === 'grid' ? (
                // Grid View
              <Card
                key={tournament.id}
                  className="group border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
                  onClick={() => router.push(`/t/${tournament.id}`)}
                >
                  <CardHeader className="space-y-4">
                  <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-xl text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                        {tournament.title}
                      </CardTitle>
                        <CardDescription className="text-slate-400 line-clamp-2">
                        {tournament.description}
                      </CardDescription>
                    </div>
                      <Badge className={`${getStatusColor(tournament.status)} border flex items-center gap-1 px-2 py-1`}>
                        <StatusIcon className="w-3 h-3" />
                      {getStatusLabel(tournament.status)}
                      </Badge>
                    </div>
                    
                    {timeUntilStart && (
                      <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full w-fit">
                        <Clock className="w-3 h-3" />
                        {timeUntilStart}
                  </div>
                    )}
                </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Trophy className="w-4 h-4 text-blue-400" />
                        <span>{getFormatLabel(tournament.format)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Users className="w-4 h-4 text-green-400" />
                        <span>{tournament.participant_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(tournament.start_at)}</span>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white group-hover:shadow-lg transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/t/${tournament.id}`);
                      }}
                    >
                      Ver Detalles
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                // List View
                <Card
                  key={tournament.id}
                  className="group border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600 transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/t/${tournament.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                              {tournament.title}
                            </h3>
                            <Badge className={`${getStatusColor(tournament.status)} border flex items-center gap-1 px-2 py-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {getStatusLabel(tournament.status)}
                            </Badge>
                            {timeUntilStart && (
                              <div className="flex items-center gap-1 text-sm text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                                <Clock className="w-3 h-3" />
                                {timeUntilStart}
                              </div>
                            )}
                          </div>
                          <p className="text-slate-400 line-clamp-1">{tournament.description}</p>
                  <div className="flex items-center gap-6 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-blue-400" />
                      <span>{getFormatLabel(tournament.format)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>{formatDate(tournament.start_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-green-400" />
                      <span>{tournament.participant_count || 0} participantes</span>
                    </div>
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/t/${tournament.id}`);
                        }}
                      >
                        Ver Detalles
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-16">
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-slate-500" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              {activeFilters.size > 0 
                ? 'No se encontraron torneos' 
                : 'No hay torneos disponibles'
              }
              </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              {activeFilters.size > 0
                ? 'Intenta con otros términos de búsqueda o ajusta los filtros aplicados'
                : 'Sé el primero en crear un torneo épico y comenzar la competencia'
              }
            </p>
            {activeFilters.size === 0 && user?.email === 'dvdsalomon6@gmail.com' && (
              <Button
                onClick={() => router.push('/tournaments/create')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Crear Primer Torneo
              </Button>
            )}
            {activeFilters.size > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Limpiar todos los filtros
                </Button>
              </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}