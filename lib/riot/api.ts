export class RiotAPI {
  private apiKey: string;
  private baseUrl: string = 'https://americas.api.riotgames.com';

  constructor() {
    this.apiKey = process.env.RIOT_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('RIOT_API_KEY no está configurada');
    }
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
  async getAccountByRiotId(gameName: string, tagLine: string, platform: string): Promise<{ puuid: string; gameName: string; tagLine: string; } | null> {
    const url = `${this.baseUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    return this.fetchWithKey(url);
  }

  // Summoner endpoints
  async getSummonerByPuuid(puuid: string, platform: string): Promise<{ id: string; accountId: string; puuid: string; name: string; profileIconId: number; } | null> {
    const baseUrl = `https://${platform.toLowerCase()}.api.riotgames.com`;
    const url = `${baseUrl}/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    return this.fetchWithKey(url);
  }
}