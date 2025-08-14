"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase para uso en el navegador
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    console.log('🔑 Attempting sign in for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Supabase auth error:', error);
      throw error;
    }
    
    console.log('✅ Sign in successful for:', data.user?.email);
    console.log('🔑 Session data:', data.session);
    
    return data;
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to authentication service. Please check your internet connection and try again.');
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