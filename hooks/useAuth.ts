'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Obtener usuario inicial y sesión
    const getInitialUser = async () => {
      try {
        const [
          { data: { user } },
          { data: { session } }
        ] = await Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession()
        ]);

        console.log('🔍 Initial auth state:', {
          user: user?.email,
          session: session?.user?.email,
          hasSession: !!session
        });

        setUser(user);
      } catch (error) {
        console.error('Error getting initial user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    mounted,
    isAuthenticated: !!user,
  };
}
