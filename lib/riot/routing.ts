export type Routing = 'AMERICAS' | 'EUROPE' | 'ASIA';

const PLATFORM_TO_ROUTING: Record<string, Routing> = {
  // Americas
  'NA1': 'AMERICAS',
  'BR1': 'AMERICAS',
  'LA1': 'AMERICAS',
  'LA2': 'AMERICAS',
  
  // Europe
  'EUW1': 'EUROPE',
  'EUN1': 'EUROPE',
  'TR1': 'EUROPE',
  'RU': 'EUROPE',
  
  // Asia
  'KR': 'ASIA',
  'JP1': 'ASIA',
  'OC1': 'ASIA',
  'PH2': 'ASIA',
  'SG2': 'ASIA',
  'TH2': 'ASIA',
  'TW2': 'ASIA',
  'VN2': 'ASIA',
};

export function getRoutingFromPlatform(platform: string): Routing {
  const routing = PLATFORM_TO_ROUTING[platform.toUpperCase()];
  if (!routing) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return routing;
}

export function getRoutingRegion(routing: Routing): string {
  const routingToRegion: Record<Routing, string> = {
    'AMERICAS': 'americas',
    'EUROPE': 'europe',
    'ASIA': 'asia',
  };
  return routingToRegion[routing];
}