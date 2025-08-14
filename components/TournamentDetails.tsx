'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trophy, Calendar, Users, Target, Clock, Star } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

interface User {
  id: string;
  displayName: string | null;
  email: string;
}

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  status: string;
  queues: number[];
  scoringJson: any;
  _count: {
    registrations: number;
  };
}

interface LeaderboardEntry {
  user_id: string;
  email: string;
  display_name: string | null;
  summoner_name: string | null;
  region: string;
  matches_played: number;
  total_points: number;
  wins: number;
  losses: number;
  avg_kda: number | null;
  last_match_at: string | null;
}

interface TournamentDetailsProps {
  tournament: Tournament;
  userRegistration: any;
  leaderboard: LeaderboardEntry[];
  currentUser: any;
}

const QUEUE_NAMES: Record<number, string> = {
  420: 'Ranked Solo/Duo',
  440: 'Ranked Flex',
  430: 'Normal Blind',
  400: 'Normal Draft',
  450: 'ARAM',
};

export function TournamentDetails({ 
  tournament, 
  userRegistration, 
  leaderboard, 
  currentUser 
}: TournamentDetailsProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const now = new Date();
  const isActive = tournament.status === 'active' && now >= tournament.startAt && now <= tournament.endAt;
  const canRegister = isActive && !userRegistration && currentUser;

  const handleRegistration = async () => {
    if (!currentUser) {
      toast.error('Please sign in to register for tournaments');
      return;
    }

    setIsRegistering(true);
    
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/register`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register');
      }

      toast.success('Successfully registered for tournament!');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const getStatusBadge = () => {
    if (isActive) {
      return <Badge className="status-active">Active</Badge>;
    } else if (tournament.status === 'draft') {
      return <Badge className="status-draft">Upcoming</Badge>;
    } else if (tournament.status === 'finished') {
      return <Badge className="status-finished">Finished</Badge>;
    }
    return <Badge variant="secondary">{tournament.status}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Tournament Header */}
      <Card className="tournament-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <CardTitle className="text-3xl">{tournament.name}</CardTitle>
                <CardDescription className="text-lg mt-1">
                  {tournament.description || 'No description available'}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tournament Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Duration</p>
                <p className="font-medium">
                  {formatDistance(tournament.startAt, tournament.endAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Participants</p>
                <p className="font-medium">{tournament._count.registrations}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <p className="font-medium">
                  {isActive 
                    ? `Ends ${formatDistance(tournament.endAt, now, { addSuffix: true })}` 
                    : tournament.status === 'draft'
                      ? `Starts ${formatDistance(tournament.startAt, now, { addSuffix: true })}`
                      : 'Finished'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Registration Status & Action */}
          {isActive && (
            <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div>
                <h3 className="font-medium text-blue-300">
                  {userRegistration ? 'You are registered!' : 'Registration Open'}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {userRegistration 
                    ? 'Play ranked games to earn points and climb the leaderboard'
                    : 'Join this tournament and start competing'
                  }
                </p>
              </div>
              {canRegister && (
                <Button 
                  onClick={handleRegistration}
                  disabled={isRegistering}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isRegistering ? 'Registering...' : 'Join Tournament'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Tournament Rules */}
        <Card className="tournament-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Rules & Scoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Valid Queues</h4>
              <div className="flex flex-wrap gap-2">
                {tournament.queues.map((queueId) => (
                  <Badge key={queueId} variant="outline">
                    {QUEUE_NAMES[queueId] || `Queue ${queueId}`}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Point System</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Win</span>
                  <span className="text-green-400">+{tournament.scoringJson.winPoints} points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Loss</span>
                  <span className="text-red-400">+{tournament.scoringJson.lossPoints} points</span>
                </div>
                {tournament.scoringJson.kdaBonus && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">KDA ≥ {tournament.scoringJson.kdaBonus.threshold}</span>
                    <span className="text-blue-400">+{tournament.scoringJson.kdaBonus.points} bonus</span>
                  </div>
                )}
                {tournament.scoringJson.maxCountedMatches && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max games counted</span>
                    <span>{tournament.scoringJson.maxCountedMatches}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mini Leaderboard */}
        <Card className="tournament-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Leaderboard
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/t/${tournament.id}/leaderboard`}>
                  View Full
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div key={entry.user_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-slate-600 text-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {entry.summoner_name || entry.display_name || entry.email}
                        </span>
                        <span className="text-xs text-slate-400">
                          {entry.wins}W - {entry.losses}L • {entry.matches_played} games
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-400">
                        {entry.total_points} pts
                      </span>
                      {entry.avg_kda && (
                        <div className="text-xs text-slate-400">
                          KDA: {entry.avg_kda.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-4">
                No participants yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}