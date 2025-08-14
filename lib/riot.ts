const RIOT_API_KEY = process.env.RIOT_API_KEY;
const RIOT_REGION = process.env.RIOT_REGION || 'americas';
const RIOT_PLATFORM = process.env.RIOT_PLATFORM || 'LA2';

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface Summoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

interface RiotError {
  status: {
    message: string;
    status_code: number;
  };
}

// Rate limiting helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'X-Riot-Token': RIOT_API_KEY!,
          ...options.headers,
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        console.warn(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}`);
        await sleep(waitTime);
        continue;
      }

      if (response.status >= 500) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Server error ${response.status}, waiting ${waitTime}ms before retry ${attempt + 1}`);
        await sleep(waitTime);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) break;
      
      const waitTime = Math.pow(2, attempt) * 1000;
      console.warn(`Request failed, waiting ${waitTime}ms before retry ${attempt + 1}`, error);
      await sleep(waitTime);
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

export async function getAccountByRiotId(gameName: string, tagLine: string, region: string): Promise<RiotAccount> {
  if (!RIOT_API_KEY) {
    throw new Error('RIOT_API_KEY not configured');
  }

  const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  
  const response = await fetchWithRetry(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Riot account not found. Please check your Riot ID and region.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.');
    }
    throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function getSummonerByPuuid(puuid: string, platform: string): Promise<Summoner> {
  if (!RIOT_API_KEY) {
    throw new Error('RIOT_API_KEY not configured');
  }

  const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  
  const response = await fetchWithRetry(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Summoner not found for this PUUID.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.');
    }
    throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function getRecentMatchIds(puuid: string, region: string, count: number = 20): Promise<string[]> {
  if (!RIOT_API_KEY) {
    throw new Error('RIOT_API_KEY not configured');
  }

  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
  
  const response = await fetchWithRetry(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No matches found for this account.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.');
    }
    throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Helper para validar regiones y plataformas
export function validateRegion(region: string): boolean {
  const validRegions = ['americas', 'europe', 'asia', 'sea'];
  return validRegions.includes(region);
}

export function validatePlatform(platform: string): boolean {
  const validPlatforms = ['BR1', 'EUN1', 'EUW1', 'JP1', 'KR', 'LA1', 'LA2', 'NA1', 'OC1', 'PH2', 'RU', 'SG2', 'TH2', 'TR1', 'TW2', 'VN2'];
  return validPlatforms.includes(platform);
}
