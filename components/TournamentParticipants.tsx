'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Participant {
  user_id: string;
  registered_at: string;
  riot_account: {
    game_name: string;
    tag_line: string;
    platform: string;
  } | null;
}

interface TournamentParticipantsProps {
  tournamentId: string;
}

export function TournamentParticipants({ tournamentId }: TournamentParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoizar la instancia de Supabase
  const supabase = useMemo(() => createClientComponentClient(), []);

  const loadParticipants = useCallback(async () => {
    try {
      // Primero obtenemos los registros
      const { data: registrations, error: registrationsError } = await supabase
        .from('tournament_registrations')
        .select('user_id, registered_at')
        .eq('tournament_id', tournamentId)
        .order('registered_at', { ascending: true });

      if (registrationsError) throw registrationsError;

      // Luego buscamos las cuentas de Riot de esos usuarios
      if (registrations && registrations.length > 0) {
        const { data: riotAccounts, error: riotError } = await supabase
          .from('riot_accounts')
          .select('user_id, game_name, tag_line, platform')
          .in('user_id', registrations.map(r => r.user_id))
          .eq('verified', true);

        if (riotError) throw riotError;

        // Combinamos los datos
        const participantsWithAccounts = registrations.map(registration => ({
          ...registration,
          riot_account: riotAccounts?.find(account => account.user_id === registration.user_id) || null
        }));

        setParticipants(participantsWithAccounts);
      } else {
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, tournamentId]);

  // Suscribirse a cambios en la tabla de registros
  useEffect(() => {
    loadParticipants();

    // Suscribirse a cambios en tournament_registrations
    const channel = supabase
      .channel('tournament_registrations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_registrations',
          filter: `tournament_id=eq.${tournamentId}`
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, loadParticipants, supabase]);

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5 text-blue-500" />
          Participantes
        </CardTitle>
        <CardDescription className="text-slate-400">
          {participants.length} {participants.length === 1 ? 'jugador inscrito' : 'jugadores inscritos'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-slate-400">Cargando participantes...</div>
        ) : participants.length === 0 ? (
          <div className="text-center text-slate-400">No hay participantes inscritos aún</div>
        ) : (
          <div className="space-y-4">
            {participants.map((participant) => (
              <div 
                key={participant.user_id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
              >
                <div>
                  {participant.riot_account ? (
                    <div className="text-white">
                      {participant.riot_account.game_name}
                      <span className="text-slate-400">#{participant.riot_account.tag_line}</span>
                    </div>
                  ) : (
                    <div className="text-slate-400">Usuario sin cuenta vinculada</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}