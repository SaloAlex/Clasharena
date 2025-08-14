import { getRoutingRegion } from './routing';
import { withRiotApiRetry } from './rate-limit';

export interface RateLimitConfig {
  personalLimits: number[];
  applicationLimits: number[];
}

export class RiotAPIClient {
  private apiKey: string;
  private baseUrl: string = 'https://americas.api.riotgames.com'; // Default to Americas

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setRouting(routing: 'AMERICAS' | 'EUROPE' | 'ASIA') {
    const region = getRoutingRegion(routing);
    this.baseUrl = `https://${region}.api.riotgames.com`;
  }

  private async request<T>(endpoint: string): Promise<T> {
    return withRiotApiRetry(async () => {
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': this.apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(`Rate limited. Retry after: ${retryAfter}s`);
        }
        throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    });
  }

  async getMatchIds(params: {
    puuid: string;
    startTime?: number;
    endTime?: number;
    queue?: number;
    type?: string;
    start?: number;
    count?: number;
  }): Promise<string[]> {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'puuid' && value !== undefined) {
        query.append(key, value.toString());
      }
    });

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<string[]>(`/lol/match/v5/matches/by-puuid/${params.puuid}/ids${queryString}`);
  }

  async getMatch(matchId: string): Promise<any> {
    return this.request(`/lol/match/v5/matches/${matchId}`);
  }

  async getSummonerByPuuid(puuid: string, region: string): Promise<any> {
    const baseUrl = `https://${region}.api.riotgames.com`;
    const response = await fetch(`${baseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`, {
      headers: {
        'X-Riot-Token': this.apiKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Summoner API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getLeagueEntries(summonerId: string, region: string): Promise<any> {
    const baseUrl = `https://${region}.api.riotgames.com`;
    const response = await fetch(`${baseUrl}/lol/league/v4/entries/by-summoner/${summonerId}`, {
      headers: {
        'X-Riot-Token': this.apiKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`League API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getChampions(): Promise<any> {
    const response = await fetch('https://ddragon.leagueoflegends.com/cdn/14.1.1/data/en_US/champion.json');
    
    if (!response.ok) {
      throw new Error(`Champions API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getQueues(): Promise<any> {
    const response = await fetch('https://static.developer.riotgames.com/docs/lol/queues.json');
    
    if (!response.ok) {
      throw new Error(`Queues API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const riotApi = new RiotAPIClient(process.env.RIOT_API_KEY || '');