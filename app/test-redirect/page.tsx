'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function TestRedirectPage() {
  const { user, loading, mounted, isAuthenticated } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  const checkSession = async () => {
    setLoadingSession(true);
    try {
      const response = await fetch('/api/debug-session');
      const data = await response.json();
      setSessionData(data);
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Redirect - Problema de Redirección</h1>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Cliente (useAuth)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Autenticado:</strong> {isAuthenticated ? '✅ Sí' : '❌ No'}</p>
              <p><strong>Usuario:</strong> {user ? user.email : 'Ninguno'}</p>
              <p><strong>Loading:</strong> {loading ? '⏳ Cargando' : '✅ Listo'}</p>
              <p><strong>Mounted:</strong> {mounted ? '✅ Sí' : '❌ No'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Servidor (API)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={checkSession} disabled={loadingSession}>
                {loadingSession ? 'Verificando...' : 'Verificar Sesión'}
              </Button>
              
              {sessionData && (
                <div className="space-y-2">
                  <p><strong>Sesión existe:</strong> {sessionData.session?.exists ? '✅ Sí' : '❌ No'}</p>
                  <p><strong>Usuario servidor:</strong> {sessionData.user?.email || 'Ninguno'}</p>
                  <p><strong>Errores:</strong> {sessionData.errors?.session || 'Ninguno'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pruebas de Redirección</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">1. Probar acceso directo a Link Riot</h3>
                <Button asChild>
                  <a href="/link-riot" target="_blank">Abrir Link Riot en nueva pestaña</a>
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">2. Probar login con redirect</h3>
                <Button asChild>
                  <a href="/auth?redirect=/link-riot" target="_blank">Login con redirect a Link Riot</a>
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">3. Verificar cookies</h3>
                <Button onClick={() => {
                  console.log('Cookies:', document.cookie);
                  alert('Revisa la consola para ver las cookies');
                }}>
                  Mostrar Cookies en Consola
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {sessionData && (
          <Card>
            <CardHeader>
              <CardTitle>Datos Completos de Sesión</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-800 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(sessionData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
