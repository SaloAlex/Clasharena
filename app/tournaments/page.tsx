// app/tournaments/page.tsx
import { prisma } from '@/lib/prisma';
import { TournamentCard } from '@/components/TournamentCard';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { Tournament, Prisma } from '@prisma/client';

// Esto obliga a que Next.js ejecute todo del lado del servidor
export const dynamic = 'force-dynamic';

type TournamentWithCount = Tournament & {
  _count: { registrations: number };
};

async function getTournaments(): Promise<TournamentWithCount[]> {
  return prisma.tournament.findMany({
    include: {
      _count: { select: { registrations: true } },
    },
    orderBy: { startAt: 'desc' },
  });
}

interface SectionProps {
  title: string;
  badge: string;
  badgeClass?: string;
  badgeVariant?: 'outline' | 'secondary';
  tournaments: TournamentWithCount[];
}

function Section({ title, badge, badgeClass, badgeVariant, tournaments }: SectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Badge className={badgeClass} variant={badgeVariant}>{badge}</Badge>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t} participantCount={t._count.registrations} />
        ))}
      </div>
    </section>
  );
}

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  const activeTournaments = tournaments.filter(t => t.status === 'active');
  const upcomingTournaments = tournaments.filter(t => t.status === 'draft');
  const finishedTournaments = tournaments.filter(t => t.status === 'finished');

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium mb-4">
            <Trophy className="w-4 h-4 mr-2" />
            {activeTournaments.length} Active Tournaments
          </div>
          <h1 className="text-4xl font-bold mb-4">League of Legends Tournaments</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Join competitive tournaments and climb the leaderboards by playing your favorite League of Legends ranked queues
          </p>
        </div>

        {activeTournaments.length > 0 && (
          <Section
            title="Active Tournaments"
            badge="Live"
            badgeClass="bg-green-500/20 text-green-400"
            tournaments={activeTournaments}
          />
        )}

        {upcomingTournaments.length > 0 && (
          <Section
            title="Upcoming Tournaments"
            badge="Starting Soon"
            badgeVariant="outline"
            tournaments={upcomingTournaments}
          />
        )}

        {finishedTournaments.length > 0 && (
          <Section
            title="Finished Tournaments"
            badge="Completed"
            badgeVariant="secondary"
            tournaments={finishedTournaments}
          />
        )}

        {tournaments.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-400 mb-2">No tournaments available</h3>
            <p className="text-slate-500">Check back later for new tournaments!</p>
          </div>
        )}
      </div>
    </div>
  );
}
