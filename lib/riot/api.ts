import { Platform, Region, PLATFORM_TO_REGION } from './constants';

export class RiotAPI {
  private apiKey: string;
  private baseUrls: {
    [key in Region]: string;
  };

  constructor() {
    this.apiKey = process.env.RIOT_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('RIOT_API_KEY no está configurada');
    }

    this.baseUrls = {
      americas: 'https://americas.api.riotgames.com',
      asia: 'https://asia.api.riotgames.com',
      europe: 'https://europe.api.riotgames.com',
      sea: 'https://sea.api.riotgames.com'
    };
  }

  private async fetchWithKey(url: string) {
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': this.apiKey
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error en API de Riot: ${response.status}`);
    }

    return response.json();
  }

  // Account endpoints
  async getAccountByRiotId(gameName: string, tagLine: string, platform: Platform): Promise<{ puuid: string; gameName: string; tagLine: string; } | null> {
    const region = PLATFORM_TO_REGION[platform];
    const baseUrl = this.baseUrls[region];
    const url = `${baseUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    return this.fetchWithKey(url);
  }

  // Summoner endpoints
  async getSummonerByPuuid(puuid: string, platform: Platform): Promise<{ id: string; accountId: string; puuid: string; name: string; profileIconId: number; } | null> {
    const baseUrl = `https://${platform.toLowerCase()}.api.riotgames.com`;
    const url = `${baseUrl}/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    return this.fetchWithKey(url);
  }
}