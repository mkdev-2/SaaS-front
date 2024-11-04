import api from './api';

export interface KommoConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

export interface KommoLead {
  id: number;
  name: string;
  status_id: number;
  price: number;
  responsible_user_id: number;
  created_at: number;
  updated_at: number;
}

class KommoAPI {
  private static instance: KommoAPI;
  private config: KommoConfig | null = null;

  private constructor() {}

  static getInstance(): KommoAPI {
    if (!KommoAPI.instance) {
      KommoAPI.instance = new KommoAPI();
    }
    return KommoAPI.instance;
  }

  setConfig(config: KommoConfig) {
    this.config = config;
  }

  getAuthUrl(): string {
    if (!this.config) throw new Error('Kommo not configured');
    
    const params = new URLSearchParams({
      client_id: this.config.client_id,
      redirect_uri: this.config.redirect_uri,
      response_type: 'code',
      mode: 'popup'
    });

    return `https://www.kommo.com/oauth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<void> {
    if (!this.config) throw new Error('Kommo not configured');

    try {
      const response = await api.post('/integrations/kommo/oauth', {
        code,
        client_id: this.config.client_id,
        client_secret: this.config.client_secret,
        redirect_uri: this.config.redirect_uri
      });

      this.config = {
        ...this.config,
        ...response.data
      };

      // Save updated config to backend
      await api.put('/integrations/kommo/config', this.config);
    } catch (error) {
      console.error('Error exchanging code:', error);
      throw new Error('Failed to authenticate with Kommo');
    }
  }

  async getLeads(query?: { status_id?: number; page?: number }): Promise<KommoLead[]> {
    try {
      const response = await api.get('/integrations/kommo/leads', { params: query });
      return response.data;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw new Error('Failed to fetch leads from Kommo');
    }
  }
}

export const kommoAPI = KommoAPI.getInstance();
export default kommoAPI;