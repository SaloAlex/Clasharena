'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TestFlowPage() {
  const { user, loading, mounted, isAuthenticated } = useAuth();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Flow - Flujo de Autenticación</h1>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Estado Actual</CardTitle>
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
            <CardTitle>Pruebas de Flujo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">1. Probar acceso a Link Riot (debería redirigir si no autenticado)</h3>
                <Button asChild>
                  <Link href="/link-riot">Ir a Link Riot</Link>
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">2. Probar acceso directo a Auth con redirect</h3>
                <Button asChild>
                  <Link href="/auth?redirect=/link-riot">Auth con redirect a Link Riot</Link>
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">3. Probar acceso a Auth sin redirect</h3>
                <Button asChild>
                  <Link href="/auth">Auth sin redirect</Link>
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">4. Debug de autenticación</h3>
                <Button asChild>
                  <Link href="/debug-auth">Debug Auth</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle>Acciones para Usuario Autenticado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button asChild>
                  <Link href="/link-riot">Link Riot Account</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/tournaments">Ver Torneos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
