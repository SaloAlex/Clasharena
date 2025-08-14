import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verificar que el torneo existe y está activo
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    if (tournament.status !== 'active' || now < tournament.startAt || now > tournament.endAt) {
      return NextResponse.json(
        { error: 'Tournament is not accepting registrations' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tiene una cuenta de LoL vinculada
    const linkedAccount = await prisma.linkedAccount.findFirst({
      where: {
        userId: user.id,
        game: 'lol',
      },
    });

    if (!linkedAccount) {
      return NextResponse.json(
        { error: 'You must link your LoL account before registering for tournaments' },
        { status: 400 }
      );
    }

    // Verificar que no está ya registrado
    const existingRegistration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You are already registered for this tournament' },
        { status: 400 }
      );
    }

    // Crear el registro
    const registration = await prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        userId: user.id,
        registeredAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      registration,
      message: 'Successfully registered for tournament',
    });

  } catch (error) {
    console.error('Error registering for tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

