'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClearCookiesButton } from '@/components/ui/clear-cookies-button';
import { useClearCookies } from '@/hooks/useClearCookies';
import { RefreshCw, Cookie, Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function ClearCookiesDebugPage() {
  const [cookies, setCookies] = useState<string[]>([]);
  const [supabaseCookies, setSupabaseCookies] = useState<string[]>([]);
  const { clearCookies, isLoading, error } = useClearCookies();

  // Función para obtener todas las cookies del navegador
  const getAllCookies = () => {
    const allCookies = document.cookie.split(';').map(cookie => cookie.trim());
    setCookies(allCookies);
    
    // Filtrar cookies de Supabase
    const supabaseCookiesList = allCookies.filter(cookie => 
      cookie.includes('supabase') || cookie.startsWith('sb-')
    );
    setSupabaseCookies(supabaseCookiesList);
  };

  // Cargar cookies al montar el componente
  useEffect(() => {
    getAllCookies();
  }, []);

  // Función para limpiar cookies del navegador (solo para debug)
  const clearBrowserCookies = () => {
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    getAllCookies();
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Debug: Limpieza de Cookies</h1>
          <p className="text-slate-400">
            Herramienta para diagnosticar y limpiar cookies de Supabase
          </p>
        </div>

        {/* Estado actual de cookies */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Cookie className="w-5 h-5" />
              Estado Actual de Cookies
            </CardTitle>
            <CardDescription className="text-slate-400">
              Cookies detectadas en el navegador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total de cookies:</span>
              <Badge variant="outline">{cookies.length}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Cookies de Supabase:</span>
              <Badge variant={supabaseCookies.length > 0 ? "destructive" : "secondary"}>
                {supabaseCookies.length}
              </Badge>
            </div>

            {supabaseCookies.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Cookies de Supabase detectadas:</h4>
                <div className="space-y-1">
                  {supabaseCookies.map((cookie, index) => (
                    <div key={index} className="text-xs text-slate-400 bg-slate-700/30 p-2 rounded">
                      {cookie}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={getAllCookies} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar Lista
            </Button>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Limpiar cookies desde servidor */}
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trash2 className="w-5 h-5" />
                Limpiar desde Servidor
              </CardTitle>
              <CardDescription className="text-slate-400">
                Usa el endpoint de la API para limpiar cookies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                Este método es más seguro y maneja todas las cookies de Supabase correctamente.
              </p>
              
              <ClearCookiesButton 
                variant="destructive" 
                className="w-full"
                onSuccess={() => {
                  setTimeout(() => getAllCookies(), 500);
                }}
              >
                Limpiar Cookies (Servidor)
              </ClearCookiesButton>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Limpiar cookies del navegador */}
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Cookie className="w-5 h-5" />
                Limpiar del Navegador
              </CardTitle>
              <CardDescription className="text-slate-400">
                Limpia todas las cookies del navegador (solo debug)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                ⚠️ Este método limpia TODAS las cookies del navegador. Solo usar para debug.
              </p>
              
              <Button 
                onClick={clearBrowserCookies} 
                variant="outline" 
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar Todas las Cookies
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Info className="w-5 h-5" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-300 space-y-2">
              <p>
                <strong>Cookies que se limpian automáticamente:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>supabase-auth-token</li>
                <li>supabase.auth.token</li>
                <li>sb-access-token</li>
                <li>sb-refresh-token</li>
                <li>sb-provider-token</li>
                <li>sb-pkce-verifier</li>
                <li>Cualquier cookie que contenga &quot;supabase&quot; o empiece con &quot;sb-&quot;</li>
              </ul>
            </div>
            
            <Separator className="bg-slate-600" />
            
            <div className="text-sm text-slate-300">
              <p>
                <strong>Cuándo usar esta herramienta:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
                <li>Problemas de autenticación con Supabase</li>
                <li>Errores de sesión persistente</li>
                <li>Problemas de login/logout</li>
                <li>Debug de problemas de cookies</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
