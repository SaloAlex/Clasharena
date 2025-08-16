'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Gamepad2, Shield, Link as LinkIcon } from 'lucide-react';
import { VerificationChallengeModal } from '@/components/riot/VerificationChallengeModal';
import { REGIONS } from '@/lib/riot/constants';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LinkRiotPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challenge, setChallenge] = useState<{
    icon_id: number;
    expires_at: string;
  } | null>(null);
  
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
          // Verificar si ya tiene una cuenta vinculada
          try {
            const response = await fetch('/api/riot/profile', {
              credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success && data.account?.verified) {
              router.push('/profile');
            }
          } catch (error) {
            console.error('Error al obtener cuenta:', error);
            // No redirigir si hay error, permitir que el usuario intente vincular
          }
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [router, supabase.auth]);

  // Parsear Riot ID
  const parseRiotId = (riotId: string) => {
    const parts = riotId.split('#');
    if (parts.length !== 2) {
      throw new Error('Riot ID debe tener el formato: Nombre#TAG');
    }
    
    const gameName = parts[0].trim();
    const tagLine = parts[1].trim();

    if (gameName.length < 3 || gameName.length > 16) {
      throw new Error('El nombre debe tener entre 3 y 16 caracteres');
    }
    if (!/^[0-9A-Za-z .]+$/.test(gameName)) {
      throw new Error('El nombre solo puede contener letras, números, espacios y puntos');
    }
    if (tagLine.length < 3 || tagLine.length > 5) {
      throw new Error('El tagLine debe tener entre 3 y 5 caracteres');
    }
    if (!/^[0-9A-Za-z]+$/.test(tagLine)) {
      throw new Error('El tagLine solo puede contener letras y números');
    }

    return { gameName, tagLine };
  };

  // Iniciar verificación
  const handleStartVerification = async () => {
    try {
      setIsLoading(true);
      
      const { gameName, tagLine } = parseRiotId(formData.riotId);
      
      const response = await fetch('/api/riot/start-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gameName,
          tagLine,
          platform: formData.platform
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar la verificación');
      }

      setChallenge({
        icon_id: data.icon_id,
        expires_at: data.expires_at
      });
      setShowChallengeModal(true);
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Completar verificación
  const handleCompleteVerification = async () => {
    try {
      setIsVerifying(true);
      
      const response = await fetch('/api/riot/complete-verification', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar la cuenta');
      }

      if (data.verified) {
        toast.success('¡Cuenta verificada exitosamente!');
        setShowChallengeModal(false);
        router.push('/profile');
      } else {
        toast.error(data.message || 'No se pudo verificar la cuenta');
      }
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

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

  // Si no está autenticado, mostrar mensaje
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-slate-400">Debes iniciar sesión para vincular tu cuenta</p>
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
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <LinkIcon className="w-5 h-5 text-blue-500" />
                Información de la Cuenta
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ingresa tu Riot ID y selecciona tu plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="riotId" className="text-sm font-medium text-white">
                  Riot ID
                </label>
                <Input
                  id="riotId"
                  placeholder="Nombre#TAG"
                  value={formData.riotId}
                  onChange={(e) => setFormData({ ...formData, riotId: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400">
                  Ejemplo: Faker#KR1
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="region" className="text-sm font-medium text-white">
                  Región
                </label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => {
                    const region = REGIONS.find(r => r.value === value);
                    setFormData({
                      ...formData,
                      region: value,
                      platform: region?.platforms[0]?.value || ''
                    });
                  }}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {REGIONS.map((region) => (
                      <SelectItem
                        key={region.value}
                        value={region.value}
                        className="text-white"
                      >
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="platform" className="text-sm font-medium text-white">
                  Plataforma
                </label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {REGIONS.find(r => r.value === formData.region)?.platforms.map((platform) => (
                      <SelectItem
                        key={platform.value}
                        value={platform.value}
                        className="text-white"
                      >
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleStartVerification}
                disabled={isLoading || !formData.riotId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Generar Desafío
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Instrucciones */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Instrucciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">1. Ingresa tu Riot ID</h3>
                <p className="text-sm text-slate-400">
                  Ingresa tu Riot ID completo incluyendo el tagline (ejemplo: Nombre#TAG)
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">2. Selecciona tu región y plataforma</h3>
                <p className="text-sm text-slate-400">
                  Elige tu región (Americas, Europa, etc.) y la plataforma donde juegas (LAS, LAN, NA, etc.)
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">3. Verifica tu cuenta</h3>
                <p className="text-sm text-slate-400">
                  Cambia tu ícono de invocador al que te indiquemos para verificar que eres el dueño de la cuenta
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de desafío */}
      {challenge && (
        <VerificationChallengeModal
          isOpen={showChallengeModal}
          onClose={() => setShowChallengeModal(false)}
          iconId={challenge.icon_id}
          expiresAt={challenge.expires_at}
          onVerify={handleCompleteVerification}
        />
      )}
    </div>
  );
}
