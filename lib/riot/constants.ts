export type Platform = 'BR1' | 'EUN1' | 'EUW1' | 'JP1' | 'KR' | 'LA1' | 'LA2' | 'NA1' | 'OC1' | 'TR1' | 'RU';
export type Region = 'americas' | 'asia' | 'europe' | 'sea';

export const PLATFORM_TO_REGION: { [key in Platform]: Region } = {
  'BR1': 'americas',
  'LA1': 'americas',
  'LA2': 'americas',
  'NA1': 'americas',
  'EUN1': 'europe',
  'EUW1': 'europe',
  'TR1': 'europe',
  'RU': 'europe',
  'JP1': 'asia',
  'KR': 'asia',
  'OC1': 'sea'
};

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
  { value: 'asia', label: 'Asia' },
  { value: 'europe', label: 'Europe' },
  { value: 'sea', label: 'Southeast Asia' }
] as const;
