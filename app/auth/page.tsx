'use client';

/* eslint-disable jsx-a11y/label-has-associated-control */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn, signUp, supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Image from 'next/image';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/tournaments';

  // Verificar si hay una sesión activa al cargar la página
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(redirectTo);
      }
    };
    checkExistingSession();
  }, [router, redirectTo]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      const result = await signIn(email, password);
      
      // Esperar a que la sesión se establezca
      const maxAttempts = 10;
      let attempts = 0;
      
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          toast.success('¡Sesión iniciada correctamente!');
          router.replace(redirectTo);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkSession, 500);
        } else {
          console.error('❌ Failed to establish session after', maxAttempts, 'attempts');
          toast.error('Error al establecer la sesión. Por favor, intenta nuevamente.');
        }
      };
      
      // Iniciar el proceso de verificación de sesión
      checkSession();
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Manejar errores específicos
      if (error.message === 'Failed to fetch') {
        toast.error('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Credenciales inválidas. Verifica tu email y contraseña.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Email no confirmado. Revisa tu bandeja de entrada.');
      } else {
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      await signUp(email, password);
      toast.success('Account created successfully!');
      // Para nuevos usuarios, siempre ir a link-riot
      router.replace('/link-riot');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
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
            {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </h2>
        </div>

        {/* Formulario */}
        <div className="cyberpunk-card">
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-6">
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
                  required 
                />
              </div>
            </div>

            {/* Campo Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="cyberpunk-label">Password</Label>
              <div className="cyberpunk-input-container">
                <Input 
                  id="password"
                  name="password" 
                  type="password" 
                  placeholder={isSignUp ? "Create a password" : "Password"}
                  className="cyberpunk-input password-input"
                  required 
                />
                {!isSignUp && (
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      onClick={() => router.push('/auth/forgot-password')}
                      className="cyberpunk-link"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
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
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'
              )}
            </Button>
          </form>

          {/* Cambiar entre Sign In y Sign Up */}
          <div className="text-center mt-6">
            <p className="cyberpunk-text">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="cyberpunk-link-button ml-1"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}