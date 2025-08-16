'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, Link as LinkIcon, Unlink } from 'lucide-react';
import { toast } from 'sonner';

interface RiotAccount {
  game_name: string;
  tag_line: string;
  platform: string;
  verified: boolean;
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
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <LinkIcon className="w-5 h-5 text-blue-500" />
              Cuenta de Riot
            </CardTitle>
            <CardDescription className="text-slate-400">
              Tu cuenta vinculada de League of Legends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {riotAccount ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Riot ID</p>
                      <p className="text-white">{riotAccount.game_name}#{riotAccount.tag_line}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">Plataforma</p>
                      <p className="text-white">{riotAccount.platform}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">Estado</p>
                      <p className="text-white flex items-center gap-1">
                        {riotAccount.verified ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Verificada
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            Pendiente
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleUnlink}
                  disabled={isUnlinking}
                  variant="destructive"
                  className="w-full"
                >
                  {isUnlinking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Desvinculando...
                    </>
                  ) : (
                    <>
                      <Unlink className="w-4 h-4 mr-2" />
                      Desvincular Cuenta
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-400 mb-4">
                  No tienes una cuenta de Riot vinculada
                </p>
                <Button
                  onClick={() => router.push('/link-riot')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Vincular Cuenta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}