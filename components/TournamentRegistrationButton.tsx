'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { toast } from 'sonner';
import { Shield, AlertTriangle, Trophy, Swords, Info, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePlayerRank } from '@/hooks/usePlayerRank';
import { canJoinTournament } from '@/lib/rank-utils';

interface TournamentRegistrationButtonProps {
  tournament: {
    id: string;
    title: string;
    min_rank: string;
    max_rank: string;
    allowedQueueIds?: number[];
    rankRestriction?: { min: string; max: string };
    allowed_queues: {
      [key: string]: {
        enabled: boolean;
        queue_id: number;
        point_multiplier: number;
      };
    };
  };
  isRegistered: boolean;
  hasRiotAccount: boolean;
  riotAccount?: {
    puuid: string;
    platform: string;
  };
}

export function TournamentRegistrationButton({
  tournament,
  isRegistered,
  hasRiotAccount,
  riotAccount
}: TournamentRegistrationButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<any>(null);
  const [loadingPlayerInfo, setLoadingPlayerInfo] = useState(false);

  // Usar el hook de rango del jugador
  const { rank: playerRank } = usePlayerRank(riotAccount?.puuid);

  // Obtener las colas habilitadas
  const enabledQueues = Object.entries(tournament.allowed_queues)
    .filter(([_, config]) => config.enabled)
    .map(([key]) => {
      const queueNames: { [key: string]: string } = {
        'RANKED_SOLO': 'Ranked Solo/Duo',
        'RANKED_FLEX': 'Ranked Flex',
        'NORMAL_DRAFT': 'Normal Draft',
        'NORMAL_BLIND': 'Normal Blind',
        'ARAM': 'ARAM'
      };
      return queueNames[key] || key;
    });

  const loadPlayerInfo = useCallback(async () => {
    if (!riotAccount) return;

    try {
      setLoadingPlayerInfo(true);
      const response = await fetch(`/api/player/info/${riotAccount.puuid}?region=${riotAccount.platform}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlayerInfo(data);
        }
      }
    } catch (error) {
      console.error('Error loading player info:', error);
    } finally {
      setLoadingPlayerInfo(false);
    }
  }, [riotAccount]);

  // Cargar información del jugador cuando se abre el modal
  useEffect(() => {
    if (isOpen && hasRiotAccount && riotAccount) {
      loadPlayerInfo();
    }
  }, [isOpen, hasRiotAccount, riotAccount, loadPlayerInfo]);

  // Obtener el rango más alto del jugador usando las nuevas utilidades
  const getHighestRank = () => {
    if (!playerRank) return 'Sin rango';

    const soloQ = playerRank.solo_q ? {
      tier: playerRank.solo_q.tier,
      rank: playerRank.solo_q.rank,
      lp: playerRank.solo_q.lp
    } : null;

    const flex = playerRank.flex ? {
      tier: playerRank.flex.tier,
      rank: playerRank.flex.rank,
      lp: playerRank.flex.lp
    } : null;

    if (!soloQ && !flex) return 'Sin rango';

    const highest = soloQ && flex ? 
      (soloQ.lp > flex.lp ? soloQ : flex) : 
      (soloQ || flex);

    if (!highest) return 'Sin rango';

    return `${highest.tier} ${highest.rank} • ${highest.lp} LP`;
  };

  // Verificar si el rango actual está dentro de los límites usando las nuevas utilidades
  const rankValidation = () => {
    if (!playerRank) {
      return { allowed: false, reason: 'No hay datos de rango disponibles' };
    }

    const playerRanks = {
      soloQ: playerRank.solo_q ? {
        tier: playerRank.solo_q.tier,
        rank: playerRank.solo_q.rank,
        lp: playerRank.solo_q.lp
      } : null,
      flex: playerRank.flex ? {
        tier: playerRank.flex.tier,
        rank: playerRank.flex.rank,
        lp: playerRank.flex.lp
      } : null
    };

    const tournamentConfig = {
      allowedQueueIds: tournament.allowedQueueIds || [420, 440], // Default a SoloQ y Flex
      rankRestriction: tournament.rankRestriction || { 
        min: tournament.min_rank, 
        max: tournament.max_rank 
      }
    };

    return canJoinTournament(playerRanks, tournamentConfig);
  };

  const handleRegistration = async () => {
    try {
      setIsRegistering(true);

      const response = await fetch(`/api/tournaments/${tournament.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrarte en el torneo');
      }

      toast.success(data.message || '¡Te has registrado exitosamente!');
      setIsOpen(false);
      router.refresh();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  if (isRegistered) {
    return (
      <Button disabled className="w-full sm:w-auto">
        <Trophy className="w-4 h-4 mr-2" />
        Ya estás registrado
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Swords className="w-4 h-4 mr-2" />
          Registrarme
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrarse en {tournament.title}</DialogTitle>
          <DialogDescription>
            Verifica los requisitos antes de registrarte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Requisito de cuenta Riot */}
          <Alert variant={hasRiotAccount ? "default" : "destructive"}>
            <Shield className="h-4 w-4" />
            <AlertTitle>Cuenta de Riot</AlertTitle>
            <AlertDescription>
              {hasRiotAccount 
                ? "✅ Tienes una cuenta de Riot vinculada y verificada"
                : "❌ Necesitas vincular y verificar tu cuenta de Riot"}
            </AlertDescription>
          </Alert>

          {/* Información sobre validación de rango */}
          {(tournament.min_rank !== 'NONE' || tournament.max_rank !== 'NONE') && (
            <Alert variant={hasRiotAccount && playerRank ? (rankValidation().allowed ? "default" : "destructive") : "default"}>
              <Trophy className="h-4 w-4" />
              <AlertTitle>Requisito de Rango</AlertTitle>
              <AlertDescription>
                <div>
                  {tournament.min_rank === tournament.max_rank ? (
                    `Rango requerido: ${tournament.min_rank}`
                  ) : (
                    `Rango requerido: ${tournament.min_rank} - ${tournament.max_rank}`
                  )}
                </div>
                {hasRiotAccount && riotAccount && (
                  <div className="mt-2">
                    {!playerRank ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Cargando datos de rango...</span>
                      </div>
                    ) : playerRank ? (
                      <div className="text-sm">
                        Tu rango actual: <span className="font-medium">{getHighestRank()}</span>
                        {rankValidation().allowed ? " ✅" : " ❌"}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        No hay datos de rango disponibles
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Modos de juego permitidos */}
          <Alert>
            <Swords className="h-4 w-4" />
            <AlertTitle>Modos de Juego Permitidos</AlertTitle>
            <AlertDescription>
              Solo las partidas en estos modos contarán para puntos:
              <ul className="list-disc list-inside mt-2">
                {enabledQueues.map((queue, index) => (
                  <li key={index}>{queue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          {/* Advertencias */}
          {!hasRiotAccount && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cuenta de Riot requerida</AlertTitle>
              <AlertDescription>
                Debes vincular tu cuenta de Riot primero.
                <Button
                  variant="link"
                  className="px-0 text-white underline"
                  onClick={() => router.push('/link-riot')}
                >
                  Vincular cuenta
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {hasRiotAccount && playerRank && !rankValidation().allowed && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Rango no válido</AlertTitle>
              <AlertDescription>
                {rankValidation().reason || `Tu rango actual (${getHighestRank()}) no cumple con los requisitos del torneo.`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRegistration}
            disabled={isRegistering || !hasRiotAccount || (playerRank ? !rankValidation().allowed : false)}
          >
            {isRegistering ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              'Confirmar Registro'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}