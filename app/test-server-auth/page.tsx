import { getSession } from '@/lib/supabase-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function TestServerAuthPage() {
  const session = await getSession();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Server Auth - Estado Real de Sesión</h1>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Sesión (Servidor)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Sesión:</strong> {session ? '✅ Activa' : '❌ No hay sesión'}</p>
              <p><strong>Usuario:</strong> {session?.user?.email || 'Ninguno'}</p>
              <p><strong>ID Usuario:</strong> {session?.user?.id || 'Ninguno'}</p>
              <p><strong>Expira:</strong> {session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pruebas de Acceso</CardTitle>
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
                <h3 className="font-medium mb-2">2. Verificar middleware</h3>
                <p className="text-sm text-slate-400">
                  Revisa la consola del servidor para ver los logs del middleware
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {session ? (
          <Card>
            <CardHeader>
              <CardTitle>✅ Sesión Activa en Servidor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600">
                El servidor detecta tu sesión. Si aún te redirige al login, hay un problema en el middleware.
              </p>
              <Button asChild className="mt-4">
                <Link href="/link-riot">Probar Link Riot</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>❌ No Hay Sesión en Servidor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">
                El servidor no detecta tu sesión. Necesitas iniciar sesión primero.
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
