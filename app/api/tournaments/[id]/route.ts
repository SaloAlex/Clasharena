import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Verificar que el usuario sea el creador del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('creator_id')
      .eq('id', params.id)
      .single();

    if (tournamentError || !tournament) {
      return new NextResponse("Torneo no encontrado", { status: 404 });
    }

    if (tournament.creator_id !== session.user.id) {
      return new NextResponse("No autorizado para eliminar este torneo", { status: 403 });
    }

    // Eliminar el torneo
    const { error: deleteError } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      throw deleteError;
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('[TOURNAMENTS_DELETE]', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
