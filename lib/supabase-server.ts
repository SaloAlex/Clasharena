import { cookies } from 'next/headers'
import {
  createRouteHandlerClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs'

// Para API routes
export const supabaseRoute = () => createRouteHandlerClient({ cookies })

// Opcional: para Server Components (páginas/layouts)
export const supabaseRSC = () => createServerComponentClient({ cookies })

// Helper de auth para API routes
export async function requireAuthRoute() {
  const supabase = supabaseRoute()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')
  return user
}
