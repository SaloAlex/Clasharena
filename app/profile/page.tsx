'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Gamepad2, Link as LinkIcon, Unlink, User, Shield, Trophy, Target, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { MatchHistory } from '@/components/MatchHistory';
import { ChampionMastery } from '@/components/ChampionMastery';
import { PlayerStats } from '@/components/PlayerStats';
import { PlayerRankDisplay } from '@/components/PlayerRankDisplay';

interface RiotAccount {
  game_name: string;
  tag_line: string;
  platform: string;
  verified: boolean;
  puuid: string;
}

interface KickAccount {
  kick_id: string;
  kick_username: string;
  kick_display_name: string;
  kick_profile_image: string;
  kick_access_token: string;
  kick_expires_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isUnlinkingKick, setIsUnlinkingKick] = useState(false);
  const [riotAccount, setRiotAccount] = useState<RiotAccount | null>(null);
  const [kickAccount, setKickAccount] = useState<KickAccount | null>(null);

  // Verificar autenticación y cargar datos
  useEffect(() => {
    // Mostrar mensaje de éxito si viene de conectar Kick
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('kick') === 'connected') {
      toast.success('¡Cuenta de Kick conectada exitosamente!');
      // Limpiar el parámetro de la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth');
          return;
        }

        // Cargar cuenta de Riot
        const riotResponse = await fetch('/api/riot/profile', {
          credentials: 'include'
        });
        const riotData = await riotResponse.json();

        if (riotData.success) {
          setRiotAccount(riotData.account);
        }

        // Cargar cuenta de Kick
        const kickResponse = await fetch('/api/kick/profile', {
          credentials: 'include'
        });
        const kickData = await kickResponse.json();

        if (kickData.success) {
          setKickAccount(kickData.kickAccount);
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

  // Desvincular cuenta de Riot
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
        toast.success('Cuenta de Riot desvinculada exitosamente');
      } else {
        throw new Error(data.error || 'Error al desvincular cuenta');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUnlinking(false);
    }
  };

  // Desvincular cuenta de Kick
  const handleUnlinkKick = async () => {
    try {
      setIsUnlinkingKick(true);
      
      const response = await fetch('/api/kick/unlink', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setKickAccount(null);
        toast.success('Cuenta de Kick desvinculada exitosamente');
      } else {
        throw new Error(data.error || 'Error al desvincular cuenta de Kick');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUnlinkingKick(false);
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Cargando perfil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Minimalista con Animación */}
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Mi Perfil
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md mx-auto">
            Gestiona tu cuenta y revisa tus estadísticas de juego
          </p>
        </div>

        {/* Cuenta de Riot - Diseño Mejorado */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-4">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 dark:text-white text-xl">
                    Cuenta de Riot
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Estado de tu cuenta vinculada
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {riotAccount ? (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700/50 dark:to-blue-900/20 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-white dark:ring-slate-800 shadow-lg">
                    <AvatarFallback className="text-white font-semibold">
                      {riotAccount.game_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {riotAccount.game_name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">
                        #{riotAccount.tag_line}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {riotAccount.platform.toUpperCase()}
                      </Badge>
                      {riotAccount.verified && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 animate-pulse">
                          <Shield className="w-3 h-3 mr-1" />
                          Verificada
                        </Badge>
                      )}

                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleUnlink}
                  disabled={isUnlinking}
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-105"
                >
                  {isUnlinking ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                  ) : (
                    <>
                      <Unlink className="w-4 h-4 mr-2" />
                      Desvincular
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-transform duration-300">
                  <LinkIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Sin cuenta vinculada
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                  Vincula tu cuenta de Riot para acceder a todas las funcionalidades
                </p>
                <Button
                  onClick={() => router.push('/link-riot')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Vincular Cuenta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cuenta de Kick - Diseño Mejorado */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-4">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#20FF86] to-[#1AE676] rounded-xl">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 dark:text-white text-xl">
                    Cuenta de Kick
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Estado de tu cuenta de streaming
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {kickAccount ? (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-[#20FF86]/10 dark:from-slate-700/50 dark:to-[#20FF86]/20 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 bg-gradient-to-br from-[#20FF86] to-[#1AE676] ring-2 ring-white dark:ring-slate-800 shadow-lg">
                    {kickAccount.kick_profile_image ? (
                      <Image 
                        src={kickAccount.kick_profile_image} 
                        alt={kickAccount.kick_username}
                        width={48}
                        height={48}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-white font-semibold">
                        {kickAccount.kick_username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {kickAccount.kick_display_name || kickAccount.kick_username}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">
                        @{kickAccount.kick_username}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#20FF86]/20 text-[#20FF86] border-[#20FF86]/30 dark:bg-[#20FF86]/10 dark:text-[#20FF86] dark:border-[#20FF86]/20">
                        <Shield className="w-3 h-3 mr-1" />
                        Conectada
                      </Badge>
                      <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Streaming
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`https://kick.com/${kickAccount.kick_username}`, '_blank')}
                    variant="outline"
                    size="sm"
                    className="border-[#20FF86]/30 text-[#20FF86] hover:bg-[#20FF86]/10 dark:border-[#20FF86]/50 dark:text-[#20FF86] dark:hover:bg-[#20FF86]/20"
                  >
                    Ver Canal
                  </Button>
                  <Button
                    onClick={handleUnlinkKick}
                    disabled={isUnlinkingKick}
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-105"
                  >
                    {isUnlinkingKick ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                    ) : (
                      <>
                        <Unlink className="w-4 h-4 mr-2" />
                        Desvincular
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Sin cuenta de Kick vinculada
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                  Conecta tu cuenta de Kick para usar tus puntos en torneos y recibir notificaciones
                </p>
                <Button
                  onClick={() => window.location.href = '/api/auth/kick/start'}
                  className="bg-gradient-to-r from-[#20FF86] to-[#1AE676] hover:from-[#1AE676] hover:to-[#20FF86] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Conectar Kick
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contenido Principal - Grid Responsivo */}
        {riotAccount?.verified && riotAccount.puuid && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700 delay-300">
            {/* Columna Izquierda - Rango y Estadísticas */}
            <div className="lg:col-span-1 space-y-6">
              {/* Rango del Jugador */}
              <div className="animate-in slide-in-from-left-4 duration-500 delay-500">
                <PlayerRankDisplay 
                  puuid={riotAccount.puuid}
                  platform={riotAccount.platform}
                  summonerName={riotAccount.game_name}
                />
              </div>
            </div>

            {/* Columna Central y Derecha - Maestría e Historial */}
            <div className="lg:col-span-2 space-y-6">
              {/* Maestría de Campeones */}
              <div className="animate-in slide-in-from-right-4 duration-500 delay-600">
                <ChampionMastery 
                  puuid={riotAccount.puuid}
                />
              </div>

              {/* Historial de Partidas */}
              <div className="animate-in slide-in-from-right-4 duration-500 delay-700">
                <MatchHistory puuid={riotAccount.puuid} />
              </div>
            </div>
          </div>
        )}

        {/* Estado sin cuenta vinculada */}
        {!riotAccount?.verified && (
          <div className="text-center py-16 animate-in fade-in duration-700 delay-300">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Completa tu perfil
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                Vincula tu cuenta de Riot para ver tus estadísticas, rango y maestría de campeones
              </p>
              <Button
                onClick={() => router.push('/link-riot')}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-8 group"
              >
                <LinkIcon className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Comenzar
              </Button>
            </div>
          </div>
        )}

        {/* Footer con información adicional */}
        <div className="mt-16 text-center animate-in fade-in duration-700 delay-1000">
          <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Tu perfil se actualiza automáticamente</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}