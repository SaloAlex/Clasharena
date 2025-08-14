import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Trophy, Clock } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  status: string;
  queues: number[];
}

interface TournamentCardProps {
  tournament: Tournament;
  participantCount: number;
}

const QUEUE_NAMES: Record<number, string> = {
  420: 'Ranked Solo/Duo',
  440: 'Ranked Flex',
  430: 'Normal Blind',
  400: 'Normal Draft',
  450: 'ARAM',
};

export function TournamentCard({ tournament, participantCount }: TournamentCardProps) {
  const now = new Date();
  const isActive = tournament.status === 'active' && now >= tournament.startAt && now <= tournament.endAt;
  const isUpcoming = tournament.startAt > now;
  const isFinished = tournament.status === 'finished' || now > tournament.endAt;

  const getStatusBadge = () => {
    if (isActive) {
      return <Badge className="status-active">Active</Badge>;
    } else if (isUpcoming) {
      return <Badge className="status-draft">Upcoming</Badge>;
    } else if (isFinished) {
      return <Badge className="status-finished">Finished</Badge>;
    }
    return <Badge variant="secondary">{tournament.status}</Badge>;
  };

  const getTimeInfo = () => {
    if (isActive) {
      return `Ends ${formatDistance(tournament.endAt, now, { addSuffix: true })}`;
    } else if (isUpcoming) {
      return `Starts ${formatDistance(tournament.startAt, now, { addSuffix: true })}`;
    } else if (isFinished) {
      return `Finished ${formatDistance(tournament.endAt, now, { addSuffix: true })}`;
    }
    return '';
  };

  return (
    <Card className="tournament-card h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg">{tournament.name}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription className="line-clamp-2">
          {tournament.description || 'No description available'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Tournament Info */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-slate-400">
              <Calendar className="w-4 h-4 mr-2" />
              {getTimeInfo()}
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <Users className="w-4 h-4 mr-2" />
              {participantCount} participants
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <Clock className="w-4 h-4 mr-2" />
              Duration: {Math.round((tournament.endAt.getTime() - tournament.startAt.getTime()) / (1000 * 60 * 60))}h
            </div>
          </div>

          {/* Valid Queues */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Valid Queues</h4>
            <div className="flex flex-wrap gap-1">
              {tournament.queues.map((queueId) => (
                <Badge key={queueId} variant="outline" className="text-xs">
                  {QUEUE_NAMES[queueId] || `Queue ${queueId}`}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <Button asChild className="w-full" variant={isActive ? 'default' : 'outline'}>
            <Link href={`/t/${tournament.id}`}>
              {isActive ? 'Join Tournament' : 'View Details'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}