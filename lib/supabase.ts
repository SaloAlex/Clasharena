'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Cliente de Supabase para uso en el navegador
export const supabase = createClientComponentClient();

// Auth helpers - Solo para uso en el cliente
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  try {
    // Primero limpiar cualquier sesión existente
    await supabase.auth.signOut();

    // Intentar iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }

    // Verificar que la sesión se estableció correctamente
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No se pudo establecer la sesión');
    }
    
    return data;
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar al servicio de autenticación. Por favor verifica tu conexión a internet e intenta nuevamente.');
    }
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}