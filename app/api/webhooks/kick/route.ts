import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const headersList = headers();
    const signature = headersList.get('kick-signature');
    
    // Verificar la firma del webhook
    if (!signature) {
      return new NextResponse('No signature provided', { status: 401 });
    }

    const body = await req.json();
    
    // Crear cliente de Supabase
    const supabase = createServerComponentClient({ cookies });

    // Procesar diferentes tipos de eventos
    switch (body.type) {
      case 'livestream.started':
        await handleStreamStarted(body, supabase);
        break;
      case 'livestream.ended':
        await handleStreamEnded(body, supabase);
        break;
      case 'subscription':
        await handleSubscription(body, supabase);
        break;
      case 'follow':
        await handleFollow(body, supabase);
        break;
      case 'chat_message':
        await handleChatMessage(body, supabase);
        break;
      default:
        console.log('Unhandled webhook event:', body.type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}

async function handleStreamStarted(data: any, supabase: any) {
  // Actualizar estado del stream en la base de datos
  await supabase
    .from('streams')
    .upsert({
      stream_id: data.data.id,
      broadcaster_id: data.data.broadcaster_id,
      status: 'live',
      title: data.data.title,
      started_at: new Date().toISOString()
    });
}

async function handleStreamEnded(data: any, supabase: any) {
  // Actualizar estado del stream
  await supabase
    .from('streams')
    .update({ 
      status: 'ended',
      ended_at: new Date().toISOString()
    })
    .eq('stream_id', data.data.id);
}

async function handleSubscription(data: any, supabase: any) {
  // Registrar nueva suscripción
  await supabase
    .from('subscriptions')
    .insert({
      user_id: data.data.user.id,
      tier: data.data.tier,
      subscribed_at: new Date().toISOString()
    });

  // Actualizar puntos del usuario
  await supabase.rpc('add_subscription_points', {
    user_id: data.data.user.id,
    points: 1000 // Puntos por suscripción
  });
}

async function handleFollow(data: any, supabase: any) {
  // Registrar nuevo seguidor
  await supabase
    .from('followers')
    .insert({
      user_id: data.data.user.id,
      followed_at: new Date().toISOString()
    });

  // Actualizar puntos del usuario
  await supabase.rpc('add_follow_points', {
    user_id: data.data.user.id,
    points: 100 // Puntos por follow
  });
}

async function handleChatMessage(data: any, supabase: any) {
  // Procesar comandos especiales del chat
  if (data.data.message.startsWith('!')) {
    await handleChatCommand(data.data.message, data.data.user.id, supabase);
  }

  // Registrar mensaje para análisis
  await supabase
    .from('chat_messages')
    .insert({
      user_id: data.data.user.id,
      message: data.data.message,
      sent_at: new Date().toISOString()
    });
}

async function handleChatCommand(message: string, userId: string, supabase: any) {
  const command = message.split(' ')[0].toLowerCase();

  switch (command) {
    case '!points':
      // Implementar lógica para mostrar puntos
      break;
    case '!register':
      // Implementar lógica para registrar usuario
      break;
    case '!tournament':
      // Implementar lógica para info de torneo
      break;
    // Agregar más comandos según necesidad
  }
}
