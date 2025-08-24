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

      // Solo manejar SIGNED_OUT real, ignorar otros eventos
      if (event === 'SIGNED_OUT') {
        const currentPath = window.location.pathname;
        const protectedPaths = ['/profile', '/tournaments', '/t/'];
        const isOnProtectedPath = protectedPaths.some(path => currentPath.startsWith(path));
        
        if (isOnProtectedPath) {
          console.log('User signed out, redirecting to auth');
          router.replace('/auth');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, isInitialized]);

  // No renderizar hasta que esté inicializado
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return children;
}
