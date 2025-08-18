'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, Link as LinkIcon, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { MatchHistory } from '@/components/MatchHistory';
import { ChampionMastery } from '@/components/ChampionMastery';
import { PlayerStats } from '@/components/PlayerStats';

interface RiotAccount {
  game_name: string;
  tag_line: string;
  platform: string;
  verified: boolean;
  puuid: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [riotAccount, setRiotAccount] = useState<RiotAccount | null>(null);

  // Verificar autenticación y cargar datos
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        // Cargar cuenta de Riot
        const response = await fetch('/api/riot/profile', {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
          setRiotAccount(data.account);
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        toast.error('Error al cargar el perfil');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  // Desvincular cuenta
  const handleUnlink = async () => {
    try {
      setIsUnlinking(true);
      
      const response = await fetch('/api/riot/unlink', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setRiotAccount(null);
        toast.success('Cuenta desvinculada exitosamente');
      } else {
        throw new Error(data.error || 'Error al desvincular cuenta');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUnlinking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Cargando perfil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Gamepad2 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Tu Perfil</h1>
          <p className="text-slate-400">
            Gestiona tus cuentas vinculadas y preferencias
          </p>
        </div>

        {/* Cuenta de Riot */}
        <div className="flex justify-end mb-6">
          <Card className="w-auto border-slate-700 bg-slate-800/50">
            <CardContent className="p-4">
              {riotAccount ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{riotAccount.game_name}</span>
                        <span className="text-slate-400">#{riotAccount.tag_line}</span>
                        <span className="text-slate-400 text-sm">{riotAccount.platform}</span>
                        {riotAccount.verified && (
                          <span className="w-2 h-2 rounded-full bg-green-500" title="Cuenta verificada"></span>
                        )}
                      </div>
                    </div>
                    <div className="relative group">
                      <Button
                        onClick={handleUnlink}
                        disabled={isUnlinking}
                        variant="destructive"
                        size="sm"
                        className="relative"
                      >
                        {isUnlinking ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Unlink className="w-4 h-4" />
                            <span className="sr-only">Desvincular cuenta</span>
                          </>
                        )}
                      </Button>
                      <div className="absolute hidden group-hover:block -bottom-8 right-0 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap">
                        Desvincular cuenta
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Sin cuenta vinculada</span>
                  <div className="relative group">
                    <Button
                      onClick={() => router.push('/link-riot')}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span className="sr-only">Vincular cuenta</span>
                    </Button>
                    <div className="absolute hidden group-hover:block -bottom-8 right-0 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap">
                      Vincular cuenta
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Maestría de Campeones */}
        {riotAccount?.verified && riotAccount.puuid && (
          <ChampionMastery 
            puuid={riotAccount.puuid}
            region={riotAccount.platform.toLowerCase()}
          />
        )}

        {/* Historial de Partidas */}
        {riotAccount?.verified && riotAccount.puuid && (
          <MatchHistory puuid={riotAccount.puuid} />
        )}
      </div>
    </div>
  );
}