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

interface TournamentRegistrationButtonProps {
  tournament: {
    id: string;
    title: string;
    min_rank: string;
    max_rank: string;
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

  // Obtener el rango más alto del jugador
  const getHighestRank = () => {
    if (!playerInfo?.ranks) return null;

    const soloRank = playerInfo.ranks.soloQueue;
    const flexRank = playerInfo.ranks.flexQueue;

    const RANK_ORDER = {
      'IRON': 0, 'BRONZE': 1, 'SILVER': 2, 'GOLD': 3,
      'PLATINUM': 4, 'EMERALD': 5, 'DIAMOND': 6,
      'MASTER': 7, 'GRANDMASTER': 8, 'CHALLENGER': 9
    };

    let highestRank = null;
    let highestValue = -1;

    if (soloRank?.tier) {
      const value = RANK_ORDER[soloRank.tier as keyof typeof RANK_ORDER] || 0;
      if (value > highestValue) {
        highestValue = value;
        highestRank = `${soloRank.tier} ${soloRank.rank}`;
      }
    }

    if (flexRank?.tier) {
      const value = RANK_ORDER[flexRank.tier as keyof typeof RANK_ORDER] || 0;
      if (value > highestValue) {
        highestValue = value;
        highestRank = `${flexRank.tier} ${flexRank.rank}`;
      }
    }

    return highestRank || 'Sin rango';
  };

  // Verificar si el rango actual está dentro de los límites
  const isRankValid = () => {
    if (tournament.min_rank === 'NONE' && tournament.max_rank === 'NONE') {
      return true;
    }

    if (!playerInfo?.ranks) return false;

    const soloRank = playerInfo.ranks.soloQueue;
    const flexRank = playerInfo.ranks.flexQueue;

    const RANK_ORDER = {
      'IRON': 0, 'BRONZE': 1, 'SILVER': 2, 'GOLD': 3,
      'PLATINUM': 4, 'EMERALD': 5, 'DIAMOND': 6,
      'MASTER': 7, 'GRANDMASTER': 8, 'CHALLENGER': 9
    };

    let highestRankValue = -1;

    if (soloRank?.tier) {
      const value = RANK_ORDER[soloRank.tier as keyof typeof RANK_ORDER] || 0;
      highestRankValue = Math.max(highestRankValue, value);
    }

    if (flexRank?.tier) {
      const value = RANK_ORDER[flexRank.tier as keyof typeof RANK_ORDER] || 0;
      highestRankValue = Math.max(highestRankValue, value);
    }

    if (highestRankValue === -1) {
      return tournament.min_rank === 'NONE';
    }

    const minRankValue = tournament.min_rank !== 'NONE' ? RANK_ORDER[tournament.min_rank as keyof typeof RANK_ORDER] : 0;
    const maxRankValue = tournament.max_rank !== 'NONE' ? RANK_ORDER[tournament.max_rank as keyof typeof RANK_ORDER] : 9;

    return highestRankValue >= minRankValue && highestRankValue <= maxRankValue;
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
            <Alert variant={hasRiotAccount && playerInfo ? (isRankValid() ? "default" : "destructive") : "default"}>
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
                    {loadingPlayerInfo ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Verificando tu rango...</span>
                      </div>
                    ) : playerInfo ? (
                      <div className="text-sm">
                        Tu rango actual: <span className="font-medium">{getHighestRank()}</span>
                        {isRankValid() ? " ✅" : " ❌"}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        No se pudo obtener información del rango
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

          {hasRiotAccount && playerInfo && !isRankValid() && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Rango no válido</AlertTitle>
              <AlertDescription>
                Tu rango actual ({getHighestRank()}) no cumple con los requisitos del torneo.
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
            disabled={isRegistering || !hasRiotAccount || (playerInfo && !isRankValid())}
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