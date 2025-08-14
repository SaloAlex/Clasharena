import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      displayName: 'Tournament Admin',
      role: 'admin',
    },
  });

  console.log('👤 Created admin user:', adminUser.email);

  // Create sample active tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Weekly Championship',
      description: 'Compete in ranked solo/duo and flex queue games to earn points!',
      startAt: new Date(),
      endAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      queues: [420, 440], // Ranked Solo/Duo and Ranked Flex
      status: 'active',
      scoringJson: {
        winPoints: 3,
        lossPoints: 0,
        kdaBonus: { threshold: 3.0, points: 1 },
        minDurationSec: 1200,
        minDurationBonusPoints: 1,
        maxCountedMatches: 10,
      },
    },
  });

  console.log('🏆 Created tournament:', tournament.name);

  // Create test users with dummy LinkedAccounts
  const testUsers = [
    {
      email: 'player1@example.com',
      displayName: 'TestPlayer1',
      puuid: 'test-puuid-1-' + Math.random().toString(36).substring(7),
      summonerName: 'TestSummoner1',
    },
    {
      email: 'player2@example.com',
      displayName: 'TestPlayer2',
      puuid: 'test-puuid-2-' + Math.random().toString(36).substring(7),
      summonerName: 'TestSummoner2',
    },
    {
      email: 'player3@example.com',
      displayName: 'TestPlayer3',
      puuid: 'test-puuid-3-' + Math.random().toString(36).substring(7),
      summonerName: 'TestSummoner3',
    },
  ];

  for (const userData of testUsers) {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        displayName: userData.displayName,
        linkedAccounts: {
          create: {
            game: 'lol',
            puuid: userData.puuid,
            platform: 'EUW1',
            routing: 'EUROPE',
            summonerName: userData.summonerName,
          },
        },
      },
    });

    // Register user for tournament
    await prisma.tournamentRegistration.create({
      data: {
        tournamentId: tournament.id,
        userId: user.id,
      },
    });

    console.log('👤 Created test user:', user.email);
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });