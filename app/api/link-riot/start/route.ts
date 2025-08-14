import { NextRequest, NextResponse } from 'next/server';
import { getAccountByRiotId, validateRegion, validatePlatform } from '@/lib/riot';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { gameName, tagLine, region, platform } = await request.json();

    if (!gameName || !tagLine || !region || !platform) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }
    if (!validateRegion(region)) {
      return NextResponse.json({ error: 'Región inválida' }, { status: 400 });
    }
    if (!validatePlatform(platform)) {
      return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 });
    }

    const account = await getAccountByRiotId(gameName, tagLine, region);
    const availableIcons = [18, 37, 64, 89, 123, 456, 590, 789, 1024, 1337];
    const expectedIconId = availableIcons[Math.floor(Math.random() * availableIcons.length)];
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { error: upsertError } = await supabaseAdmin
      .from('linked_riot_accounts')
      .upsert({
        userId: user.id,
        gameName,
        tagLine,
        region,
        platform,
        puuid: account.puuid,
        verified: false,
      }, { onConflict: 'userId' });

    if (upsertError) {
      console.error(upsertError);
      return NextResponse.json({ error: 'Error al guardar la cuenta vinculada' }, { status: 500 });
    }

    const { error: challengeError } = await supabaseAdmin
      .from('riot_verification_challenges')
      .insert({
        userId: user.id,
        puuid: account.puuid,
        expectedIconId,
        expiresAt,
        consumed: false,
      });

    if (challengeError) {
      console.error(challengeError);
      return NextResponse.json({ error: 'Error al crear el desafío de verificación' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      expectedIconId,
      expiresAt: expiresAt.toISOString(),
      message: `Cambia tu ícono de invocador al #${expectedIconId} en los próximos 10 minutos y luego presiona Verificar.`,
    });

  } catch (error: any) {
    console.error('Error in link-riot/start:', error);
    if (error.message.includes('Authentication required')) {
      return NextResponse.json({ error: 'Debes iniciar sesión para vincular tu cuenta Riot.' }, { status: 401 });
    }
    if (error.message.includes('Riot account not found')) {
      return NextResponse.json({ error: 'Cuenta de Riot no encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
