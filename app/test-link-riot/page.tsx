'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TestLinkRiotPage() {
  const { user, loading, mounted, isAuthenticated } = useAuth();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Link Riot - Verificar Flujo</h1>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Autenticación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Autenticado:</strong> {isAuthenticated ? '✅ Sí' : '❌ No'}</p>
              <p><strong>Usuario:</strong> {user ? user.email : 'Ninguno'}</p>
              <p><strong>Loading:</strong> {loading ? '⏳ Cargando' : '✅ Listo'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pruebas de Navegación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">1. Acceso directo a Link Riot</h3>
                <Button asChild>
                  <Link href="/link-riot">Ir a Link Riot</Link>
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">2. Verificar URL actual</h3>
                <p className="text-sm text-slate-400">
                  URL actual: <code>{typeof window !== 'undefined' ? window.location.href : 'No disponible'}</code>
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">3. Simular clic en navbar</h3>
                <p className="text-sm text-slate-400">
                  En el navbar, haz clic en tu avatar → "Link Riot Account"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle>✅ Usuario Autenticado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600">
                Deberías poder acceder a Link Riot sin problemas.
              </p>
              <Button asChild className="mt-4">
                <Link href="/link-riot">Probar Link Riot</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>❌ Usuario No Autenticado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">
                Necesitas iniciar sesión primero.
              </p>
              <Button asChild className="mt-4">
                <Link href="/auth">Ir a Login</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
