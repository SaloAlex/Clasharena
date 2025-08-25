'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Image from 'next/image';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay una sesión de recuperación
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Enlace inválido o expirado');
        router.push('/auth');
      }
    };
    checkSession();
  }, [router]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast.success('Contraseña actualizada correctamente');
      router.push('/auth');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 cyberpunk-bg">
      <div className="w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Image
                src="/Logo_fondo.png"
                alt="CLASH ARENA"
                width={100}
                height={100}
                className="cyberpunk-logo"
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold cyberpunk-title mb-4">CLASH ARENA</h1>
          <h2 className="text-2xl font-semibold cyberpunk-subtitle">
            NUEVA CONTRASEÑA
          </h2>
        </div>

        {/* Formulario */}
        <div className="cyberpunk-card">
          <p className="text-center text-slate-300 mb-6">
            Ingresa tu nueva contraseña para completar la recuperación.
          </p>
          
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* Campo Nueva Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password" className="cyberpunk-label">Nueva Contraseña</Label>
              <div className="cyberpunk-input-container relative">
                <Input 
                  id="password"
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="cyberpunk-input password-input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="cyberpunk-label">Confirmar Contraseña</Label>
              <div className="cyberpunk-input-container relative">
                <Input 
                  id="confirmPassword"
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="cyberpunk-input password-input pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón Principal */}
            <Button 
              type="submit" 
              className="cyberpunk-button w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="cyberpunk-spinner mr-2"></div>
                  Actualizando...
                </div>
              ) : (
                'ACTUALIZAR CONTRASEÑA'
              )}
            </Button>
          </form>

          {/* Botón Volver */}
          <div className="text-center mt-6">
            <button
              onClick={handleBackToLogin}
              className="cyberpunk-link-button flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
