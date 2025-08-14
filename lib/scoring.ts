export interface ScoringConfig {
  winPoints: number;
  lossPoints: number;
  kdaBonus?: {
    threshold: number;
    points: number;
  };
  minDurationSec?: number;
  minDurationBonusPoints?: number;
  maxCountedMatches?: number;
}

export interface ScoreResult {
  points: number;
  reasons: string[];
}

export function calculatePoints(
  match: {
    win: boolean;
    kda: number;
    durationSec: number;
  },
  config: ScoringConfig
): ScoreResult {
  let totalPoints = 0;
  const reasons: string[] = [];

  // Base points for win/loss
  if (match.win) {
    totalPoints += config.winPoints;
    reasons.push('WIN');
  } else {
    totalPoints += config.lossPoints;
    if (config.lossPoints > 0) {
      reasons.push('LOSS');
    }
  }

  // KDA bonus
  if (config.kdaBonus && match.kda >= config.kdaBonus.threshold) {
    totalPoints += config.kdaBonus.points;
    reasons.push('KDA_BONUS');
  }

  // Duration bonus
  if (
    config.minDurationSec && 
    config.minDurationBonusPoints && 
    match.durationSec >= config.minDurationSec
  ) {
    totalPoints += config.minDurationBonusPoints;
    reasons.push('DURATION_BONUS');
  }

  return {
    points: Math.max(0, totalPoints), // Never negative
    reasons,
  };
}

export function shouldCountMatch(
  gameStart: number,
  registeredAt: Date,
  tournamentEnd: Date,
  currentMatchCount: number,
  maxMatches?: number
): boolean {
  const gameStartDate = new Date(gameStart);
  
  // Check if match is within tournament window
  if (gameStartDate < registeredAt || gameStartDate > tournamentEnd) {
    return false;
  }

  // Check max matches limit
  if (maxMatches && currentMatchCount >= maxMatches) {
    return false;
  }

  return true;
}