export interface RiotAccount {
  id: string;
  user_id: string;
  puuid: string;
  game_name: string;
  tag_line: string;
  platform: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface VerificationChallenge {
  id: string;
  user_id: string;
  icon_id: number;
  expires_at: string;
  completed: boolean;
  created_at: string;
}

export interface StartVerificationResponse {
  success: boolean;
  icon_id: number;
  expires_at: string;
  message: string;
}

export interface CompleteVerificationResponse {
  success: boolean;
  verified: boolean;
  message: string;
}

// Constantes
export const PLATFORMS = [
  { value: 'BR1', label: 'BR (BR1)' },
  { value: 'EUN1', label: 'EUNE (EUN1)' },
  { value: 'EUW1', label: 'EUW (EUW1)' },
  { value: 'JP1', label: 'JP (JP1)' },
  { value: 'KR', label: 'KR (KR)' },
  { value: 'LA1', label: 'LAN (LA1)' },
  { value: 'LA2', label: 'LAS (LA2)' },
  { value: 'NA1', label: 'NA (NA1)' },
  { value: 'OC1', label: 'OCE (OC1)' },
  { value: 'TR1', label: 'TR (TR1)' },
  { value: 'RU', label: 'RU (RU)' }
] as const;

export const REGIONS = [
  { value: 'americas', label: 'Americas' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'sea', label: 'SEA' }
] as const;

// Helpers
export function getPlatformRegion(platform: string): string {
  if (platform.startsWith('EU')) return 'europe';
  if (platform === 'KR' || platform === 'JP1') return 'asia';
  if (['OC1', 'PH2', 'SG2', 'TH2', 'TW2', 'VN2'].includes(platform)) return 'sea';
  return 'americas';
}
