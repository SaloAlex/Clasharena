'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signIn, signUp, supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
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
      
      console.log('Attempting sign in for:', email);
      
      const result = await signIn(email, password);
      console.log('Sign in result:', result);
      
      // Esperar a que la sesión se establezca
      const maxAttempts = 10;
      let attempts = 0;
      
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Checking session attempt', attempts + 1, ':', session?.user?.email);
        
        if (session) {
          console.log('✅ Session established:', session.user.email);
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome to LoL Tournaments</h1>
          <p className="text-slate-400 mt-2">Sign in or create an account to get started</p>
        </div>

        <Card className="tournament-card">
          <CardHeader className="pb-4">
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Enter your credentials to access your tournament account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input 
                      id="signin-email"
                      name="email" 
                      type="email" 
                      placeholder="Enter your email"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input 
                      id="signin-password"
                      name="password" 
                      type="password" 
                      placeholder="Enter your password"
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email"
                      name="email" 
                      type="email" 
                      placeholder="Enter your email"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input 
                      id="signup-password"
                      name="password" 
                      type="password" 
                      placeholder="Create a password"
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}