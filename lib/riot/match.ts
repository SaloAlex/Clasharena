export interface MatchParticipant {
  win: boolean;
  kda: number;
  queue: number;
  gameStart: number;
  durationSec: number;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
}

export function extractParticipantForPuuid(match: any, puuid: string): MatchParticipant | null {
  const participant = match.info.participants.find((p: any) => p.puuid === puuid);
  
  if (!participant) {
    return null;
  }

  const kda = participant.deaths === 0 
    ? participant.kills + participant.assists 
    : (participant.kills + participant.assists) / participant.deaths;

  return {
    win: participant.win,
    kda: Math.round(kda * 100) / 100, // Round to 2 decimals
    queue: match.info.queueId,
    gameStart: match.info.gameStartTimestamp,
    durationSec: match.info.gameDuration,
    championId: participant.championId,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
  };
}

export function isValidMatch(match: MatchParticipant, validQueues: number[], minDurationSec = 300): boolean {
  // Filter out remakes and invalid queues
  return validQueues.includes(match.queue) && match.durationSec >= minDurationSec;
}