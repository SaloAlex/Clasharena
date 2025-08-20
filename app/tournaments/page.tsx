'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Tournament {
  id: string;
  title: string;
  description: string;
  format: string;
  status: string;
  start_date: string;
  end_date: string;
  creator_id: string;
  participant_count?: number;
}

export default function TournamentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTournaments = useCallback(async () => {
    try {
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
    }
  }, [router]);

  useEffect(() => {
    loadTournaments();
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
      'draft': 'bg-slate-500/20 text-slate-300',
      'upcoming': 'bg-blue-500/20 text-blue-300',
      'active': 'bg-green-500/20 text-green-300',
      'completed': 'bg-purple-500/20 text-purple-300',
      'cancelled': 'bg-red-500/20 text-red-300'
    };
    return colors[status as keyof typeof colors] || 'bg-slate-500/20 text-slate-300';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto">
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Torneos</h1>
            <p className="text-slate-400">
              Explora y participa en torneos de League of Legends
            </p>
          </div>
          {user?.email === 'dvdsalomon6@gmail.com' && (
            <Button
              onClick={() => router.push('/tournaments/create')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Crear Torneo
            </Button>
          )}
        </div>

        {/* Tournament List */}
        <div className="space-y-6">
          {tournaments.length > 0 ? (
            tournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="border-slate-700 bg-slate-800/50 hover:bg-slate-800/70 transition-colors cursor-pointer"
                onClick={async (e) => {
                  e.preventDefault();
                  await router.push(`/t/${tournament.id}`);
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-white mb-2">
                        {tournament.title}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        {tournament.description}
                      </CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(tournament.status)}`}>
                      {getStatusLabel(tournament.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-blue-400" />
                      <span>{getFormatLabel(tournament.format)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span>{formatDate(tournament.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>{tournament.participant_count || 0} participantes</span>
                    </div>
                    <div className="ml-auto">
                      <Button variant="ghost" size="sm">
                        Ver detalles
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No hay torneos disponibles
              </h3>
              <p className="text-slate-400 mb-4">
                Sé el primero en crear un torneo
              </p>
              {user?.email === 'dvdsalomon6@gmail.com' && (
                <Button
                  onClick={() => router.push('/tournaments/create')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Crear Torneo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}