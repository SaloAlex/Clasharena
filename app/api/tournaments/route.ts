import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    console.log('Fetching tournaments for user:', user.email);
    
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[TOURNAMENTS_GET] Error:', error);
      console.error('[TOURNAMENTS_GET] Error code:', error.code);
      console.error('[TOURNAMENTS_GET] Error message:', error.message);
      console.error('[TOURNAMENTS_GET] Error details:', error.details);
      
      return NextResponse.json({ 
        error: 'Error al obtener torneos',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    if (!tournaments) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('[TOURNAMENTS_GET]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function parseJSON<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    try { 
      return JSON.parse(v) as T; 
    } catch { 
      return fallback; 
    }
  }
  return v as T;
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();

    // Coaccionar/validar fechas
    const startAt = new Date(body.start_at ?? body.startDate);
    const endAt = new Date(body.end_at ?? body.endDate);
    if (Number.isNaN(+startAt) || Number.isNaN(+endAt)) {
      return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 });
    }

    if (endAt <= startAt) {
      return NextResponse.json({ error: 'La fecha de fin debe ser posterior a la de inicio' }, { status: 400 });
    }

    // Coaccionar JSONB
    const queues = parseJSON(body.queues, {
      ranked_solo: { enabled: true, pointMultiplier: 1.0, id: 420 },
      ranked_flex: { enabled: true, pointMultiplier: 0.8, id: 440 },
      normal_draft: { enabled: false, pointMultiplier: 0.6, id: 400 },
      normal_blind: { enabled: false, pointMultiplier: 0.5, id: 430 },
      aram: { enabled: false, pointMultiplier: 0.4, id: 450 },
    });

    const prizes = parseJSON(body.prizes, { first: '', second: '', third: '' });

    // Números con fallback
    const toInt = (x: unknown, def = 0) => (Number.isFinite(Number(x)) ? Number(x) : def);

    const payload = {
      creator_id: user.id,
      title: String(body.title ?? '').trim(),
      description: String(body.description ?? '').trim(),
      format: String(body.format ?? 'league'),
      status: 'upcoming' as const,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      points_per_win: toInt(body.pointsPerWin, 100),
      points_per_loss: toInt(body.pointsPerLoss, 0),
      queues: parseJSON(body.queues, {
        ranked_solo: { enabled: true, multiplier: 1.0 },
        ranked_flex: { enabled: true, multiplier: 0.8 },
        normal_draft: { enabled: false, multiplier: 0.6 }
      }),
      prizes: parseJSON(body.prizes, { first: '', second: '', third: '' })
    };

    // Validaciones básicas
    if (!payload.title) {
      return NextResponse.json({ error: 'Título requerido' }, { status: 400 });
    }

    if (!payload.description) {
      return NextResponse.json({ error: 'Descripción requerida' }, { status: 400 });
    }

    console.log('Creating tournament with payload:', payload);
    
    const { data, error } = await supabase
      .from('tournaments')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('DB error:', error);
      return NextResponse.json({ 
        error: `Error al crear torneo: ${error.message}`,
        code: error.code,
        details: error.details
      }, { status: error.code === '42501' ? 403 : 500 });
    }

    console.log('Tournament created successfully:', data);
    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });

  } catch (error: any) {
    console.error('Error inesperado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}