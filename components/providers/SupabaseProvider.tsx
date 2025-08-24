'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Verificar sesión inicial
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error checking initial session:', error);
        setIsInitialized(true);
      }
    };

    checkInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Solo manejar eventos después de la inicialización
      if (!isInitialized) return;

      if (event === 'SIGNED_IN') {
        // Refrescar la página cuando el usuario se conecta
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        // Solo redirigir si estamos en una página protegida
        const currentPath = window.location.pathname;
        const protectedPaths = ['/profile', '/tournaments', '/t/'];
        const isOnProtectedPath = protectedPaths.some(path => currentPath.startsWith(path));
        
        if (isOnProtectedPath) {
          router.replace('/auth');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, isInitialized]);

  return children;
}
