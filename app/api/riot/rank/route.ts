import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const TIER_ORDER = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'] as const;
const DIV_SCORE = { I:4, II:3, III:2, IV:1 } as const;

const PLATFORM_MAP = {
  BR1:'br1', EUN1:'eun1', EUW1:'euw1', JP1:'jp1', KR:'kr',
  LA1:'la1', LA2:'la2', NA1:'na1', OC1:'oc1', TR1:'tr1', RU:'ru'
} as const;
type PlatformKey = keyof typeof PLATFORM_MAP;

// Fallbacks para probar múltiples plataformas cuando la primera devuelve vacío
const FALLBACKS: Record<string, string[]> = {
  la2: ['la2', 'la1'],
  la1: ['la1', 'la2'],
  br1: ['br1'],
  na1: ['na1'],
  euw1: ['euw1'],
  eun1: ['eun1'],
  kr: ['kr'],
  jp1: ['jp1'],
  oc1: ['oc1'],
  tr1: ['tr1'],
  ru: ['ru']
};

function normPlatform(p?: string) {
  const key = (p ?? 'LA2').toUpperCase() as PlatformKey;
  return PLATFORM_MAP[key] ?? 'la2';
}

function rankValue(tier?: string, div?: keyof typeof DIV_SCORE, lp?: number) {
  if (!tier || !div) return 0;
  const t = TIER_ORDER.indexOf(tier as any);
  return (t+1)*1000 + DIV_SCORE[div]*100 + (lp ?? 0);
}

async function fetchLeagueByPuuid(plat: string, puuid: string, key: string) {
  const r = await fetch(
    `https://${plat}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
    { headers: { 'X-Riot-Token': key }, cache: 'no-store' }
  );
  if (r.status === 404) return { ok: true, entries: [], status: 200 };
  if (!r.ok) return { ok: false, entries: null as any, status: r.status, detail: await r.text() };
  return { ok: true, entries: await r.json(), status: 200 };
}

export async function GET(req: NextRequest) {
  try {
    const u = new URL(req.url);
    const puuid = u.searchParams.get('puuid');
    const platInput = u.searchParams.get('platform') || undefined;
    const preferredPlat = normPlatform(platInput); // e.g. 'la2'
    if (!puuid) return NextResponse.json({ error: 'missing_puuid' }, { status: 400 });

    const key = process.env.RIOT_API_KEY;
    if (!key) return NextResponse.json({ error: 'missing_api_key' }, { status: 500 });

    const order = FALLBACKS[preferredPlat] ?? [preferredPlat];

    let usedPlat: string = preferredPlat;
    let entries: any[] = [];
    for (const plat of order) {
      const res = await fetchLeagueByPuuid(plat, puuid, key);
      if (!res.ok) {
        // si es 403/429, devolvemos el error directo
        if (res.status !== 200) {
          return NextResponse.json({ error: 'league_fetch_failed', status: res.status, detail: res.detail, platformTried: plat }, { status: res.status });
        }
      }
      // res.ok con 200
      if (Array.isArray(res.entries) && res.entries.length > 0) {
        usedPlat = plat;
        entries = res.entries;
        break;
      }
      // si vacío, probamos siguiente fallback
    }

    const solo = entries.find(e => e.queueType === 'RANKED_SOLO_5x5');
    const flex = entries.find(e => e.queueType === 'RANKED_FLEX_SR');

    const norm = (e: any) => e ? ({
      queueType: e.queueType,
      tier: e.tier, rank: e.rank, lp: e.leaguePoints,
      wins: e.wins, losses: e.losses, hotStreak: !!e.hotStreak,
      value: rankValue(e.tier, e.rank, e.leaguePoints),
    }) : null;

    const payload = {
      puuid,
      platformRequested: preferredPlat,
      platformUsed: usedPlat,     // 👈 te digo con cuál encontró datos
      soloQ: norm(solo),
      flex: norm(flex),
      fetchedAt: Date.now(),
    };

    // (opcional) cacheá en Supabase
    try {
      const supabase = supabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('player_ranks').upsert({
          user_id: user.id,
          puuid,
          platform: usedPlat.toUpperCase(), // Usamos la plataforma donde realmente encontramos datos
          solo_q: norm(solo),
          flex: norm(flex),
          fetched_at: new Date().toISOString(),
        }, { onConflict: 'user_id,puuid' });
      }
    } catch (dbError) {
      // Log error but don't fail the request
      console.error('Failed to cache rank data:', dbError);
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal', detail: e?.message ?? String(e) }, { status: 500 });
  }
}
