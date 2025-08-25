'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      setIsSent(true);
      toast.success('Email de recuperación enviado. Revisa tu bandeja de entrada.');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Error al enviar el email de recuperación');
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
            RECUPERAR CONTRASEÑA
          </h2>
        </div>

        {/* Formulario */}
        <div className="cyberpunk-card">
          {!isSent ? (
            <>
              <p className="text-center text-slate-300 mb-6">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              
              <form onSubmit={handleResetPassword} className="space-y-6">
                {/* Campo Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="cyberpunk-label">Email</Label>
                  <div className="cyberpunk-input-container">
                    <Input 
                      id="email"
                      name="email" 
                      type="email" 
                      placeholder="Enter your email"
                      className="cyberpunk-input email-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
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
                      Enviando...
                    </div>
                  ) : (
                    'ENVIAR EMAIL'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Email Enviado</h3>
                <p className="text-slate-300">
                  Hemos enviado un enlace de recuperación a <strong>{email}</strong>
                </p>
              </div>
            </div>
          )}

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
