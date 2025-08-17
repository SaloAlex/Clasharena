'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="w-full max-w-md">
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                  <AlertCircle className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="text-xl text-white">Algo salió mal</CardTitle>
                <CardDescription className="text-slate-400">
                  Ha ocurrido un error inesperado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-md border border-slate-700">
                  <strong>Error:</strong> {error.message || 'Error desconocido'}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={reset}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Intentar de nuevo
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full border-slate-600 hover:bg-slate-700">
                    <Link href="/">
                      <Home className="w-4 h-4 mr-2" />
                      Ir al inicio
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </body>
    </html>
  );
}
