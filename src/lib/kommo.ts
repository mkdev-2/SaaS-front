import api from './api';
import { ApiResponse } from '../types/api';

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

  async initialize(): Promise<void> {
    try {
      const { data: response } = await api.get<ApiResponse<KommoConfig>>('/integrations/kommo/config');
      if (response.status === 'success' && response.data) {
        this.config = response.data;
      } else {
        throw new Error('Failed to load Kommo configuration');
      }
    } catch (error) {
      console.error('Failed to initialize Kommo API:', error);
      throw error;
    }
  }

  async getLeads(query?: { status_id?: number; page?: number }): Promise<KommoLead[]> {
    try {
      const { data: response } = await api.get<ApiResponse<KommoLead[]>>('/integrations/kommo/leads', {
        params: query
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch leads');
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      const { data: response } = await api.post<ApiResponse<void>>('/integrations/kommo/disconnect');
      if (response.status === 'success') {
        this.config = null;
      } else {
        throw new Error(response.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting from Kommo:', error);
      throw error;
    }
  }
}

export const kommoAPI = KommoAPI.getInstance();
export default kommoAPI;