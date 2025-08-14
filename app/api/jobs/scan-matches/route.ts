import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { riotApi } from '@/lib/riot/client';
import { calculatePoints } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    // Obtener todos los torneos activos
    const activeTournaments = await prisma.tournament.findMany({
      where: {
        status: 'active',
        startAt: { lte: new Date() },
        endAt: { gte: new Date() },
      },
      include: {
        registrations: {
          include: {
            user: {
              include: {
                linkedAccounts: {
                  where: { game: 'lol' },
                },
              },
            },
          },
        },
      },
    });

    let processedMatches = 0;
    let newPoints = 0;

    for (const tournament of activeTournaments) {
      console.log(`Processing tournament: ${tournament.name}`);

      for (const registration of tournament.registrations) {
        const linkedAccount = registration.user.linkedAccounts[0];
        if (!linkedAccount) continue;

        try {
          // Obtener la última partida procesada para este usuario en este torneo
          const lastProcessedMatch = await prisma.matchRecord.findFirst({
            where: {
              puuid: linkedAccount.puuid,
            },
            orderBy: {
              gameStart: 'desc',
            },
          });

          // Configurar el cliente de Riot API para la región correcta
          riotApi.setRouting(linkedAccount.routing as any);

          // Obtener partidas recientes
          const matchIds = await riotApi.getMatchIds({
            puuid: linkedAccount.puuid,
            startTime: lastProcessedMatch 
              ? lastProcessedMatch.gameStart + 1 
              : Math.floor(registration.registeredAt.getTime()),
            endTime: Math.floor(tournament.endAt.getTime()),
            count: 20, // Procesar hasta 20 partidas por vez
          });

          for (const matchId of matchIds) {
            // Verificar si ya procesamos esta partida
            const existingMatch = await prisma.matchRecord.findUnique({
              where: { matchId },
            });

            if (existingMatch) continue;

            // Obtener detalles de la partida
            const matchData = await riotApi.getMatch(matchId);
            
            // Encontrar al jugador en la partida
            const player = matchData.info.participants.find(
              (p: any) => p.puuid === linkedAccount.puuid
            );

            if (!player) continue;

            // Verificar si la cola es válida para el torneo
            if (!tournament.queues.includes(matchData.info.queueId)) {
              continue;
            }

            // Verificar si la partida está dentro de la ventana del torneo
            const gameStartTime = matchData.info.gameStartTimestamp;
            if (gameStartTime < registration.registeredAt.getTime() || 
                gameStartTime > tournament.endAt.getTime()) {
              continue;
            }

            // Calcular duración en segundos
            const durationSec = Math.floor(matchData.info.gameDuration);

            // Calcular KDA
            const kda = player.deaths > 0 
              ? (player.kills + player.assists) / player.deaths 
              : player.kills + player.assists;

            // Guardar el registro de la partida
            await prisma.matchRecord.create({
              data: {
                matchId,
                puuid: linkedAccount.puuid,
                routing: linkedAccount.routing,
                queue: matchData.info.queueId,
                gameStart: BigInt(gameStartTime),
                durationSec,
                win: player.win,
                kda: kda,
                championId: player.championId,
                processedAt: new Date(),
              },
            });

            // Calcular puntos según la configuración del torneo
            const scoringConfig = tournament.scoringJson as any;
            const scoreResult = calculatePoints(
              {
                win: player.win,
                kda: kda,
                durationSec: durationSec,
              },
              scoringConfig
            );

            // Verificar si ya tenemos puntos para esta partida
            const existingPoints = await prisma.tournamentPoint.findMany({
              where: {
                tournamentId: tournament.id,
                userId: registration.userId,
                matchId,
              },
            });

            if (existingPoints.length === 0 && scoreResult.points > 0) {
              // Crear puntos para cada razón
              for (const reason of scoreResult.reasons) {
                await prisma.tournamentPoint.create({
                  data: {
                    tournamentId: tournament.id,
                    userId: registration.userId,
                    matchId,
                    points: scoreResult.points / scoreResult.reasons.length, // Dividir puntos por razón
                    reason,
                    createdAt: new Date(),
                  },
                });
              }

              newPoints += scoreResult.points;
            }

            processedMatches++;
          }

        } catch (error) {
          console.error(`Error processing user ${registration.userId}:`, error);
          continue;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedMatches,
      newPoints,
      tournamentsProcessed: activeTournaments.length,
    });

  } catch (error) {
    console.error('Error in scan-matches job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

