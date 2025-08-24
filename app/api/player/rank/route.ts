import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_MAP = { LA1:'la1', LA2:'la2', BR1:'br1', NA1:'na1', EUW1:'euw1', EUN1:'eun1', KR:'kr', JP1:'jp1', OC1:'oc1', TR1:'tr1', RU:'ru' } as const;
type PlatformKey = keyof typeof PLATFORM_MAP;
const DIV_SCORE = { I:4, II:3, III:2, IV:1 } as const;
const TIER_ORDER = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'] as const;

function normPlatform(p?: string) {
  const key = (p ?? 'LA2').toUpperCase() as PlatformKey;
  return PLATFORM_MAP[key] ?? 'la2';
}

function rankValue(tier?: string, div?: keyof typeof DIV_SCORE, lp?: number) {
  if (!tier || !div) return 0;
  const t = TIER_ORDER.indexOf(tier as any);
  return (t+1)*1000 + DIV_SCORE[div]*100 + (lp ?? 0);
}

type RankEntry = {
  queueType: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR';
  tier: string;          // e.g. 'SILVER'
  rank: 'I'|'II'|'III'|'IV';
  leaguePoints: number;
  wins: number;
  losses: number;
};

type SummonerDTO = {
  id: string;               // encryptedSummonerId (para league v4)
  puuid: string;
  name: string;
  profileIconId: number;
  summonerLevel: number;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const puuid = url.searchParams.get('puuid');
  const gameName = url.searchParams.get('gameName');
  const tagLine = url.searchParams.get('tagLine');
  const platform = normPlatform(url.searchParams.get('platform') || undefined);

  console.log('📥 Parámetros recibidos:', { puuid, gameName, tagLine, platform });

  // Validar que tengamos PUUID o Riot ID
  if (!puuid && (!gameName || !tagLine)) {
    return NextResponse.json({ 
      success: false, 
      error: 'Se requiere PUUID o Riot ID (gameName + tagLine)' 
    }, { status: 400 });
  }

  const API_KEY = process.env.RIOT_API_KEY;
  if (!API_KEY) {
    console.error('❌ RIOT_API_KEY no configurada o vacía');
    return NextResponse.json({ success: false, error: 'missing_api_key' }, { status: 500 });
  }
  
  console.log('🔑 API Key configurada:', API_KEY ? 'SÍ' : 'NO', 'Longitud:', API_KEY?.length);

  let resolvedPuuid = puuid;

  // ====== (1) Si no tenemos PUUID, resolver Riot ID → PUUID ======
  if (!resolvedPuuid && gameName && tagLine) {
    console.log('🔍 Resolviendo Riot ID a PUUID...');
    console.log('🔗 URL Account:', `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
    
    try {
      const accountRes = await fetch(
        `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        { 
          headers: { 
            'X-Riot-Token': API_KEY,
            'Accept': 'application/json',
            'User-Agent': 'YourApp/1.0'
          }, 
          cache: 'no-store' 
        }
      );

      console.log('📡 Respuesta Account API:', accountRes.status, accountRes.statusText);
      const accountText = await accountRes.text();
      console.log('📄 Respuesta Account raw:', accountText);

      if (!accountRes.ok) {
        console.error('❌ Error Account API:', { status: accountRes.status, detail: accountText });
        return NextResponse.json({ 
          success: false, 
          error: 'account_fetch_failed', 
          status: accountRes.status, 
          detail: accountText 
        }, { status: accountRes.status });
      }

      let accountJson: { puuid: string; gameName: string; tagLine: string };
      try { 
        accountJson = JSON.parse(accountText); 
      } catch { 
        console.error('❌ Error parseando respuesta Account:', accountText);
        return NextResponse.json({ 
          success: false, 
          error: 'account_not_json', 
          detail: accountText.slice(0,300) 
        }, { status: 502 }); 
      }

      if (!accountJson?.puuid) {
        console.error('❌ Respuesta Account inválida:', accountJson);
        return NextResponse.json({ 
          success: false, 
          error: 'account_missing_puuid', 
          detail: accountJson 
        }, { status: 502 });
      }

      resolvedPuuid = accountJson.puuid;
      console.log('✅ PUUID resuelto:', resolvedPuuid);
    } catch (error) {
      console.error('❌ Error en resolución de Riot ID:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'account_resolution_failed',
        detail: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  // ====== (2) PUUID → Summoner (encryptedSummonerId) ======
  console.log('🔍 Obteniendo Summoner por PUUID...');
  const summonerUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(resolvedPuuid!)}`;
  console.log('🔗 URL Summoner:', summonerUrl);
  console.log('🔑 Headers:', { 'X-Riot-Token': API_KEY ? `${API_KEY.substring(0, 10)}...` : 'VACÍA' });
  
  const sumRes = await fetch(
    summonerUrl,
    { 
      headers: { 
        'X-Riot-Token': API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'YourApp/1.0'
      }, 
      cache: 'no-store' 
    }
  );

  console.log('📡 Respuesta Summoner API:', sumRes.status, sumRes.statusText);
  const sumText = await sumRes.text();
  console.log('📄 Respuesta Summoner raw:', sumText);
  
  if (!sumRes.ok) {
    console.error('❌ Error Summoner API:', { status: sumRes.status, detail: sumText });
    return NextResponse.json({ 
      success: false, 
      error: 'summoner_fetch_failed', 
      status: sumRes.status, 
      detail: sumText 
    }, { status: sumRes.status });
  }

  let sJson: SummonerDTO;
  try { 
    sJson = JSON.parse(sumText); 
  } catch { 
    console.error('❌ Error parseando respuesta Summoner:', sumText);
    return NextResponse.json({ 
      success: false, 
      error: 'summoner_not_json', 
      detail: sumText.slice(0,300) 
    }, { status: 502 }); 
  }

  if (!sJson?.id || !sJson?.name) {
    console.error('❌ Respuesta Summoner inválida:', sJson);
    return NextResponse.json({ 
      success: false, 
      error: 'summoner_missing_fields', 
      detail: sJson 
    }, { status: 502 });
  }

  console.log('✅ Summoner obtenido:', { id: sJson.id, name: sJson.name });

  // ====== (3) encryptedSummonerId → League entries ======
  console.log('🔍 Obteniendo entradas de liga...');
  const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(sJson.id)}`;
  console.log('🔗 URL League:', leagueUrl);
  
  const leagueRes = await fetch(
    leagueUrl,
    { 
      headers: { 
        'X-Riot-Token': API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'YourApp/1.0'
      }, 
      cache: 'no-store' 
    }
  );

  console.log('📡 Respuesta League API:', leagueRes.status, leagueRes.statusText);
  const leagueText = await leagueRes.text();
  console.log('📄 Respuesta League raw:', leagueText);
  
  if (!leagueRes.ok) {
    console.error('❌ Error League API:', { status: leagueRes.status, detail: leagueText });
    return NextResponse.json({ 
      success: false, 
      error: 'league_fetch_failed', 
      status: leagueRes.status, 
      detail: leagueText 
    }, { status: leagueRes.status });
  }

  let entries: RankEntry[];
  try { 
    entries = JSON.parse(leagueText); 
  } catch { 
    console.error('❌ Error parseando respuesta League:', leagueText);
    return NextResponse.json({ 
      success: false, 
      error: 'league_not_json', 
      detail: leagueText.slice(0,300) 
    }, { status: 502 }); 
  }

  console.log('📊 Entries recibidas:', entries.length, entries.map(e => e.queueType));

  const solo = entries.find(e => e.queueType === 'RANKED_SOLO_5x5') ?? null;
  const flex = entries.find(e => e.queueType === 'RANKED_FLEX_SR') ?? null;

  console.log('🏆 Rangos encontrados:', { 
    solo: solo ? `${solo.tier} ${solo.rank}` : 'Unranked',
    flex: flex ? `${flex.tier} ${flex.rank}` : 'Unranked'
  });

  const norm = (e: RankEntry | null) => e ? ({
    queueType: e.queueType,
    tier: e.tier,
    rank: e.rank,
    lp: e.leaguePoints,
    wins: e.wins,
    losses: e.losses,
    hotStreak: false, // League v4 no incluye hotStreak en entries
    value: rankValue(e.tier, e.rank, e.leaguePoints)
  }) : null;

  const payload = {
    puuid: resolvedPuuid,
    platform,
    summonerName: sJson.name,
    soloQ: norm(solo),  // null si unranked
    flex: norm(flex),   // null si unranked
    fetchedAt: Date.now()
  };

  console.log('✅ Respuesta final:', payload);
  
  return NextResponse.json({
    success: true,
    rank: payload
  }, { status: 200 });
}
