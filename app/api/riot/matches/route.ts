import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/supabase-server';
import { getMatchDetails } from '@/lib/riot';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Obtener las partidas sincronizadas del usuario
    // Primero obtener las partidas
    const { data: matches, error } = await supabaseAdmin
      .from('riot_matches')
      .select('*')
      .eq('user_id', user.id)
      .order('synced_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error al obtener partidas:', error);
      return NextResponse.json(
        { error: 'Error al obtener las partidas' },
        { status: 500 }
      );
    }

    // Luego obtener la información de la cuenta vinculada
    const { data: linkedAccount, error: accountError } = await supabaseAdmin
      .from('linked_riot_accounts')
      .select('game_name, tag_line, platform, puuid')
      .eq('user_id', user.id)
      .single();

    if (accountError) {
      console.error('Error al obtener cuenta vinculada:', accountError);
      return NextResponse.json(
        { error: 'Error al obtener información de la cuenta' },
        { status: 500 }
      );
    }

    // Obtener detalles de cada partida
    const matchDetailsPromises = matches.map(async (match) => {
      try {
        console.log('🔍 Buscando detalles para:', {
          match_id: match.match_id,
          puuid: match.puuid,
          region: linkedAccount.region
        });

        // Convertir plataforma a región de enrutamiento
        let routingRegion = 'americas'; // Por defecto para LA2
        if (linkedAccount.platform.startsWith('EU')) {
          routingRegion = 'europe';
        } else if (linkedAccount.platform === 'KR' || linkedAccount.platform === 'JP1') {
          routingRegion = 'asia';
        } else if (['OC1', 'PH2', 'SG2', 'TH2', 'TW2', 'VN2'].includes(linkedAccount.platform)) {
          routingRegion = 'sea';
        }

        console.log('🌍 Región de enrutamiento:', {
          platform: linkedAccount.platform,
          routingRegion
        });

        const details = await getMatchDetails(match.match_id, routingRegion);
        const participant = details.info.participants.find(p => p.puuid === match.puuid);

        console.log('👤 Participante encontrado:', {
          match_id: match.match_id,
          participant: participant ? {
            puuid: participant.puuid,
            championName: participant.championName,
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
            win: participant.win
          } : null
        });
        
        return {
          ...match,
          linked_riot_accounts: linkedAccount,
          details: {
            gameMode: details.info.gameMode,
            gameDuration: details.info.gameDuration,
            gameCreation: details.info.gameCreation,
            champion: participant?.championName || 'Unknown',
            kills: participant?.kills || 0,
            deaths: participant?.deaths || 0,
            assists: participant?.assists || 0,
            win: participant?.win || false,
            kda: participant ? ((participant.kills + participant.assists) / Math.max(1, participant.deaths)).toFixed(2) : '0.00'
          }
        };
      } catch (error) {
        console.error(`Error al obtener detalles de partida ${match.match_id}:`, error);
        return {
          ...match,
          linked_riot_accounts: linkedAccount,
          details: null
        };
      }
    });

    const matchesWithDetails = await Promise.all(matchDetailsPromises);

    if (error) {
      console.error('Error al obtener partidas:', error);
      return NextResponse.json(
        { error: 'Error al obtener las partidas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      matches: matchesWithDetails,
      message: `Se encontraron ${matches.length} partidas.`
    });

  } catch (error: any) {
    console.error('Error in riot/matches:', error);
    
    if (error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para ver tus partidas.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
