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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea el creador del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('creator_id')
      .eq('id', params.id)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
    }

    // Verificar permisos: ser el creador o ser admin
    const adminEmail = 'dvdsalomon6@gmail.com';
    const isOwner = tournament.creator_id === session.user.id || session.user.email === adminEmail;

    if (!isOwner) {
      return NextResponse.json({ error: 'No autorizado para eliminar este torneo' }, { status: 403 });
    }

    // Eliminar el torneo (CASCADE debería eliminar registros relacionados automáticamente)
    const { error: deleteError } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      throw deleteError;
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[TOURNAMENTS_DELETE]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
