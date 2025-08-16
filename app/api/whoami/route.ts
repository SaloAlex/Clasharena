import { NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase-server'

export async function GET() {
  const supabase = supabaseRoute()
  const { data: { user }, error } = await supabase.auth.getUser()
  return NextResponse.json({ user, error: error?.message ?? null })
}