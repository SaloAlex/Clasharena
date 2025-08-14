'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  Gamepad2, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Trophy,
  RefreshCw,
  Link,
  Unlink
} from 'lucide-react';

interface ChallengeData {
  expectedIconId: number;
  expiresAt: string;
  message: string;
}

interface VerificationResult {
  verified: boolean;
  reason?: string;
  message?: string;
}

export default function LinkRiotPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [matches, setMatches] = useState(() => {
    // Intentar cargar las partidas desde localStorage al iniciar
    if (typeof window !== 'undefined') {
      const savedMatches = localStorage.getItem('riot_matches');
      return savedMatches ? JSON.parse(savedMatches) : [];
    }
    return [];
  });
  const [formData, setFormData] = useState({
    riotId: '',
    region: 'americas',
    platform: 'LA2'
  });

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
        
        if (user) {
          // Si el usuario está autenticado, cargar las partidas
          handleLoadMatches();
        }
        
        console.log('Link Riot: User authenticated:', !!user);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  // Cargar estado de verificación al iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVerified = localStorage.getItem('riot_verified') === 'true';
      setIsVerified(savedVerified);
    }
  }, []);

  // Timer para el desafío
  useEffect(() => {
    if (!challenge) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiresAt = new Date(challenge.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setChallenge(null);
        toast.error('El desafío ha expirado. Genera uno nuevo.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  // Parsear y validar Riot ID
  const parseRiotId = (riotId: string) => {
    const parts = riotId.split('#');
    if (parts.length !== 2) {
      throw new Error('Riot ID debe tener el formato: gameName#tagLine');
    }
    
    const gameName = parts[0].trim();
    const tagLine = parts[1].trim();

    // Validar gameName
    if (gameName.length < 3 || gameName.length > 16) {
      throw new Error('El nombre debe tener entre 3 y 16 caracteres');
    }
    if (!/^[0-9A-Za-z .]+$/.test(gameName)) {
      throw new Error('El nombre solo puede contener letras, números, espacios y puntos');
    }

    // Validar tagLine
    if (tagLine.length < 3 || tagLine.length > 5) {
      throw new Error('El tagLine debe tener entre 3 y 5 caracteres');
    }
    if (!/^[0-9A-Za-z]+$/.test(tagLine)) {
      throw new Error('El tagLine solo puede contener letras y números');
    }

    return { gameName, tagLine };
  };

  // Generar desafío
  const handleGenerateChallenge = async () => {
    if (!formData.riotId) {
      toast.error('Ingresa tu Riot ID');
      return;
    }

    setIsLoading(true);
    
    try {
      const { gameName, tagLine } = parseRiotId(formData.riotId);
      
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Agregar token si está disponible
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/link-riot/start', {
        method: 'POST',
        credentials: 'include', // 🔹 importante para enviar cookies
        headers,
        body: JSON.stringify({
          gameName,
          tagLine,
          region: formData.region,
          platform: formData.platform
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar el desafío');
      }

      setChallenge(data);
      toast.success('Desafío generado exitosamente');
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar desafío
  const handleVerifyChallenge = async () => {
    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/link-riot/verify', {
        method: 'POST',
        credentials: 'include', // 🔹 importante para enviar cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data: VerificationResult = await response.json();

      if (!response.ok) {
        throw new Error(data.reason || 'Error al verificar');
      }

      if (data.verified) {
        setIsVerified(true);
        localStorage.setItem('riot_verified', 'true');
        setChallenge(null);
        toast.success(data.message || '¡Cuenta verificada exitosamente!');
      } else {
        setIsVerified(false);
        localStorage.setItem('riot_verified', 'false');
        toast.error(data.reason || 'Verificación fallida');
      }
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Cargar partidas
  const handleLoadMatches = async () => {
    setIsLoadingMatches(true);
    
    try {
      const response = await fetch('/api/riot/matches', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar partidas');
      }

      const newMatches = data.matches || [];
      setMatches(newMatches);
      // Guardar en localStorage
      localStorage.setItem('riot_matches', JSON.stringify(newMatches));
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  // Sincronizar partidas
  const handleSyncMatches = async () => {
    setIsSyncing(true);
    
    try {
      const response = await fetch('/api/riot/sync', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al sincronizar partidas');
      }

      toast.success(data.message || `Se sincronizaron ${data.newMatches} nuevas partidas`);
      
      // Cargar las partidas actualizadas
      handleLoadMatches();
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const regions = [
    { value: 'americas', label: 'Américas' },
    { value: 'europe', label: 'Europa' },
    { value: 'asia', label: 'Asia' },
    { value: 'sea', label: 'Sudeste Asiático' }
  ];

  const platforms = [
    { value: 'LA1', label: 'LAN (LA1)' },
    { value: 'LA2', label: 'LAS (LA2)' },
    { value: 'NA1', label: 'NA (NA1)' },
    { value: 'BR1', label: 'BR (BR1)' },
    { value: 'EUW1', label: 'EUW (EUW1)' },
    { value: 'EUN1', label: 'EUNE (EUN1)' },
    { value: 'KR', label: 'KR (KR)' },
    { value: 'JP1', label: 'JP (JP1)' }
  ];

  // Mostrar pantalla de carga mientras verifica autenticación
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Verificando autenticación...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar mensaje de carga (el middleware manejará la redirección)
  if (!isAuthenticated && !isCheckingAuth) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-slate-400">Redirigiendo al login...</p>
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
          <h1 className="text-3xl font-bold text-white mb-2">Vincular Cuenta de Riot</h1>
          <p className="text-slate-400">
            Conecta tu cuenta de League of Legends para participar en torneos
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Formulario de vinculación */}
          <Card className="tournament-card border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Link className="w-5 h-5 text-blue-500" />
                Información de la Cuenta
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ingresa tu Riot ID y selecciona tu región
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="riotId" className="text-white">Riot ID</Label>
                <Input
                  id="riotId"
                  placeholder="gameName#tagLine"
                  value={formData.riotId}
                  onChange={(e) => setFormData({ ...formData, riotId: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400">
                  Ejemplo: SummonerName#TAG
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region" className="text-white">Región</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {regions.map((region) => (
                        <SelectItem key={region.value} value={region.value} className="text-white">
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform" className="text-white">Plataforma</Label>
                  <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {platforms.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value} className="text-white">
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateChallenge}
                disabled={isLoading || !formData.riotId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando Desafío...
                  </>
                ) : (
                  <>
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    Generar Desafío
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Estado del desafío */}
          <Card className="tournament-card border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5 text-green-500" />
                Estado de Verificación
              </CardTitle>
              <CardDescription className="text-slate-400">
                {isVerified ? 'Cuenta verificada' : 'Pendiente de verificación'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isVerified ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-400 font-medium">Cuenta Verificada</span>
                  </div>
                  
                  <div className="space-y-4">
                    <Button
                      onClick={handleSyncMatches}
                      disabled={isSyncing}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSyncing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sincronizar Partidas
                        </>
                      )}
                    </Button>

                    <div className="p-4 bg-slate-700/50 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-white">Últimas Partidas</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLoadMatches}
                          disabled={isLoadingMatches}
                          className="text-xs"
                        >
                          {isLoadingMatches ? 'Cargando...' : 'Actualizar'}
                        </Button>
                      </div>
                      
                      {matches.length > 0 ? (
                        <div className="space-y-2">
                          {matches.map((match) => (
                            <div
                              key={match.match_id}
                              className={`flex items-center justify-between p-3 rounded ${
                                match.details?.win ? 'bg-green-950/50' : 'bg-red-950/50'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-medium">
                                      {match.details?.champion || 'Unknown'}
                                    </span>
                                    <Badge variant="outline" className={`text-xs ${
                                      match.details?.win ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                      {match.details?.win ? 'Victoria' : 'Derrota'}
                                    </Badge>
                                  </div>
                                  <div className="text-slate-400 text-xs space-x-2">
                                    <span>{match.details?.gameMode || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>{Math.floor((match.details?.gameDuration || 0) / 60)}m</span>
                                    <span>•</span>
                                    <span>{new Date(match.details?.gameCreation || 0).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-white mb-1">
                                  {match.details?.kills}/{match.details?.deaths}/{match.details?.assists}
                                </div>
                                <div className="text-xs text-slate-400">
                                  KDA: {match.details?.kda}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-400 text-sm">
                          No hay partidas sincronizadas
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : challenge ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-400 font-medium">Desafío Activo</span>
                    </div>
                    <div className="text-sm text-white mb-4">
                      <p className="mb-2">Cambia tu ícono de invocador a este:</p>
                      <div className="flex flex-col items-center gap-2 p-4 bg-slate-700/50 rounded-lg">
                        <img
                          src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${challenge.expectedIconId}.png`}
                          alt={`Ícono ${challenge.expectedIconId}`}
                          className="w-20 h-20 rounded-lg border-2 border-blue-500/40"
                        />
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">
                          Ícono #{challenge.expectedIconId}
                        </Badge>
                        <p className="text-xs text-slate-400 text-center mt-2">
                          Este es un ícono básico que todos los jugadores tienen disponible.
                          <br />
                          Puedes encontrarlo en la primera página de tus íconos.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>Tiempo restante: {formatTime(timeLeft)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleVerifyChallenge}
                    disabled={isVerifying || timeLeft <= 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isVerifying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verificando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verificar
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 text-slate-400">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>Genera un desafío para comenzar</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Beneficios */}
        <Card className="tournament-card border-slate-700 bg-slate-800/50 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Beneficios de vincular tu cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-white">Seguimiento automático de partidas</p>
                    <p className="text-xs text-slate-400">
                      Tus partidas se detectan y puntúan automáticamente
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-white">Clasificaciones en tiempo real</p>
                    <p className="text-xs text-slate-400">
                      Ve tu ranking actualizarse mientras juegas
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-white">Participación en torneos</p>
                    <p className="text-xs text-slate-400">
                      Únete a torneos con un solo clic
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-white">Análisis de rendimiento</p>
                    <p className="text-xs text-slate-400">
                      Rastrea tu progreso en los torneos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
