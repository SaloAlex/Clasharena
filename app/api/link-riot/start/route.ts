import { NextRequest, NextResponse } from 'next/server';
import { getAccountByRiotId, validateRegion, validatePlatform } from '@/lib/riot';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting link-riot/start endpoint');
    
    const user = await requireAuth();
    console.log('✅ User authenticated:', user.id);
    
    const body = await request.json();
    console.log('📦 Request body:', body);
    
    const { gameName, tagLine, region, platform } = body;

    if (!gameName || !tagLine || !region || !platform) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }
    if (!validateRegion(region)) {
      return NextResponse.json({ error: 'Región inválida' }, { status: 400 });
    }
    if (!validatePlatform(platform)) {
      return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 });
    }

    console.log('🎮 Buscando cuenta de Riot:', { gameName, tagLine, region });
    const account = await getAccountByRiotId(gameName, tagLine, region);
    console.log('✅ Cuenta de Riot encontrada:', account.puuid);
    // Íconos básicos que todos los jugadores tienen por defecto
    const availableIcons = [
      0,  // Ícono por defecto
      1,  // Ícono básico azul
      2,  // Ícono básico verde
      3,  // Ícono básico rojo
      4,  // Ícono básico amarillo
      5,  // Ícono básico morado
      6,  // Ícono básico naranja
      7,  // Ícono básico rosa
      8,  // Ícono básico celeste
      9,  // Ícono básico gris
      10, // Ícono básico dorado
      11, // Ícono básico plateado
      12, // Ícono básico bronce
      13, // Ícono básico negro
      14, // Ícono básico blanco
      15  // Ícono básico turquesa
    ];
    const expectedIconId = availableIcons[Math.floor(Math.random() * availableIcons.length)];
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Verificar si el PUUID ya está vinculado a otra cuenta
    const { data: existingPuuidAccount } = await supabaseAdmin
      .from('linked_riot_accounts')
      .select('userId, gameName, tagLine')
      .eq('puuid', account.puuid)
      .single();

    if (existingPuuidAccount && existingPuuidAccount.userId !== user.id) {
      return NextResponse.json({ 
        error: 'Esta cuenta de Riot ya está vinculada a otro usuario.' 
      }, { status: 400 });
    }

    // Verificar si el usuario ya tiene una cuenta vinculada
    const { data: existingUserAccount } = await supabaseAdmin
      .from('linked_riot_accounts')
      .select('*')
      .eq('userId', user.id)
      .single();

    console.log('🔍 Cuenta existente:', { existingUserAccount, existingPuuidAccount });

    try {
      if (existingUserAccount) {
        // Actualizar la cuenta existente
        const { error: updateError } = await supabaseAdmin
          .from('linked_riot_accounts')
          .update({
            gameName,
            tagLine,
            region,
            platform,
            puuid: account.puuid,
            verified: false,
            updatedAt: new Date().toISOString()
          })
          .eq('userId', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error al actualizar:', updateError);
          throw updateError;
        }
      } else {
        // Crear nueva cuenta vinculada
        console.log('📝 Creando nueva cuenta vinculada:', {
          userId: user.id,
          gameName,
          tagLine,
          region,
          platform,
          puuid: account.puuid
        });

        // Intentar insertar con más detalles de error
        console.log('🔍 Intentando insertar con los siguientes datos:', {
          userId: user.id,
          gameName,
          tagLine,
          region,
          platform,
          puuid: account.puuid
        });

        // Intentar insertar usando SQL directo
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('linked_riot_accounts')
          .upsert({
            user_id: user.id,
            game_name: gameName,
            tag_line: tagLine,
            region: region,
            platform: platform,
            puuid: account.puuid,
            verified: false,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        console.log('📊 Resultado de inserción:', {
          success: !insertError,
          data: insertData,
          error: insertError
        });

        if (insertError) {
          console.error('❌ Error detallado al insertar:', {
            error: insertError,
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          throw new Error(insertError.message || 'Error desconocido al insertar');
        }
      }

      console.log('✅ Operación completada exitosamente');

    } catch (error: any) {
      console.error('❌ Error en operación de base de datos:', error);
      
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ 
          error: 'Esta cuenta de Riot ya está vinculada. Si crees que esto es un error, contacta a soporte.' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: `Error al procesar la cuenta: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    // Marcar todos los desafíos anteriores como consumidos
    console.log('🧹 Marcando desafíos anteriores como consumidos para:', { userId: user.id, puuid: account.puuid });
    
    const { error: updateError } = await supabaseAdmin
      .from('riot_verification_challenges')
      .update({ consumed: true })
      .eq('user_id', user.id)
      .eq('puuid', account.puuid);

    if (updateError) {
      console.error('❌ Error al actualizar desafíos anteriores:', updateError);
      // Continuamos a pesar del error, ya que podría ser que no hubiera desafíos anteriores
    }

    // Verificar que la cuenta exista
    const { data: existingAccount, error: checkAccountError } = await supabaseAdmin
      .from('linked_riot_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('puuid', account.puuid)
      .single();

    console.log('🔍 Verificando cuenta vinculada:', {
      account: existingAccount,
      error: checkAccountError
    });

    if (!existingAccount) {
      console.log('❌ Cuenta no encontrada, intentando crear...');
      const { data: newAccount, error: createError } = await supabaseAdmin
        .from('linked_riot_accounts')
        .insert({
          user_id: user.id,
          game_name: gameName,
          tag_line: tagLine,
          region: region,
          platform: platform,
          puuid: account.puuid,
          verified: false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log('📝 Resultado de crear cuenta:', {
        account: newAccount,
        error: createError
      });

      if (createError) {
        throw new Error('Error al crear la cuenta vinculada');
      }
    }

    // Crear nuevo desafío usando RPC para evitar conflictos
    console.log('📝 Creando nuevo desafío de verificación:', {
      userId: user.id,
      puuid: account.puuid,
      expectedIconId,
      expiresAt
    });

    const { data: challengeData, error: challengeError } = await supabaseAdmin
      .rpc('create_verification_challenge', {
        p_user_id: user.id,
        p_puuid: account.puuid,
        p_expected_icon_id: expectedIconId,
        p_expires_at: expiresAt.toISOString()
      });

    console.log('📊 Resultado de crear desafío:', {
      data: challengeData,
      error: challengeError
    });

    if (challengeError) {
      console.error('❌ Error al crear desafío:', challengeError);
      return NextResponse.json({ error: 'Error al crear el desafío de verificación' }, { status: 500 });
    }

    // Verificar que el desafío se creó correctamente
    const { data: createdChallenge, error: verifyError } = await supabaseAdmin
      .from('riot_verification_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('puuid', account.puuid)
      .eq('consumed', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('🔍 Verificando desafío creado:', {
      challenge: createdChallenge,
      error: verifyError
    });

    if (!createdChallenge) {
      return NextResponse.json({ error: 'Error al crear el desafío' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      expectedIconId: createdChallenge.expected_icon_id,
      expiresAt: createdChallenge.expires_at,
      message: `Cambia tu ícono de invocador al #${createdChallenge.expected_icon_id} en los próximos 10 minutos y luego presiona Verificar.`,
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
