// Utilidades para manejo de rangos de League of Legends

export const TIER_ORDER = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'] as const;
export type Tier = typeof TIER_ORDER[number];
export type Division = 'I'|'II'|'III'|'IV';

const DIV_SCORE: Record<Division, number> = { I:4, II:3, III:2, IV:1 };

// Convertir rango a valor numérico para comparaciones
export function toScore(tier: string, rank: Division, lp = 0): number {
  const t = TIER_ORDER.indexOf(tier as Tier);
  if (t < 0) return 0;
  return (t + 1) * 1000 + DIV_SCORE[rank] * 100 + lp;
}

// Tipo para límites de rango
export type RankBound = { tier: Tier, rank: Division };

// Verificar si un rango está dentro de los límites especificados
export function isInRange(
  actual: { tier: string; rank: Division; lp: number } | null,
  min?: RankBound | 'NONE',
  max?: RankBound | 'NONE'
): boolean {
  if (!actual) return min === 'NONE'; // si está unranked, sólo pasa si tu mínimo es NONE
  
  const v = toScore(actual.tier, actual.rank, actual.lp);
  const minV = (!min || min === 'NONE') ? 0 : toScore(min.tier, min.rank, 0);
  const maxV = (!max || max === 'NONE') ? Infinity : toScore(max.tier, max.rank, 100);
  
  return v >= minV && v <= maxV;
}

// Verificar si un jugador puede participar en un torneo basado en sus rangos
export function canJoinTournament(
  playerRanks: {
    soloQ: { tier: string; rank: Division; lp: number } | null;
    flex: { tier: string; rank: Division; lp: number } | null;
  },
  tournament: {
    allowedQueueIds: number[];
    rankRestriction: { min: string; max: string };
  }
): { allowed: boolean; reason?: string } {
  const { allowedQueueIds, rankRestriction } = tournament;
  
  // Si no hay restricción de rango, permitir
  if (rankRestriction.min === 'NONE' && rankRestriction.max === 'NONE') {
    return { allowed: true };
  }

  // Convertir strings a RankBound
  const minRank = rankRestriction.min !== 'NONE' ? 
    { tier: rankRestriction.min as Tier, rank: 'IV' as Division } : 'NONE';
  const maxRank = rankRestriction.max !== 'NONE' ? 
    { tier: rankRestriction.max as Tier, rank: 'I' as Division } : 'NONE';

  // Verificar SoloQ si está permitido
  const soloQAllowed = allowedQueueIds.includes(420) && 
    isInRange(playerRanks.soloQ, minRank, maxRank);

  // Verificar Flex si está permitido
  const flexAllowed = allowedQueueIds.includes(440) && 
    isInRange(playerRanks.flex, minRank, maxRank);

  // Si no hay colas ranked, permitir
  const hasRankedQueues = allowedQueueIds.some(id => [420, 440].includes(id));
  if (!hasRankedQueues) {
    return { allowed: true };
  }

  // Si al menos una cola ranked está permitida y cumple el rango
  if (soloQAllowed || flexAllowed) {
    return { allowed: true };
  }

  // Generar mensaje de error
  const rankRange = `${rankRestriction.min} - ${rankRestriction.max}`;
  const playerRanksText = [
    playerRanks.soloQ ? `${playerRanks.soloQ.tier} ${playerRanks.soloQ.rank}` : 'Unranked SoloQ',
    playerRanks.flex ? `${playerRanks.flex.tier} ${playerRanks.flex.rank}` : 'Unranked Flex'
  ].join(', ');

  return {
    allowed: false,
    reason: `Tu rango actual (${playerRanksText}) no cumple los requisitos del torneo (${rankRange})`
  };
}

// Formatear rango para mostrar
export function formatRank(rank: { tier: string; rank: Division; lp: number } | null): string {
  if (!rank) return 'Unranked';
  return `${rank.tier} ${rank.rank} • ${rank.lp} LP`;
}

// Obtener el rango más alto entre SoloQ y Flex
export function getHighestRank(
  soloQ: { tier: string; rank: Division; lp: number } | null,
  flex: { tier: string; rank: Division; lp: number } | null
): { tier: string; rank: Division; lp: number } | null {
  if (!soloQ && !flex) return null;
  if (!soloQ) return flex;
  if (!flex) return soloQ;

  const soloQScore = toScore(soloQ.tier, soloQ.rank, soloQ.lp);
  const flexScore = toScore(flex.tier, flex.rank, flex.lp);

  return soloQScore >= flexScore ? soloQ : flex;
}
