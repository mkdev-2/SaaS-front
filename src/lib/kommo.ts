import api from './api';
import { ApiResponse } from '../types/api';
import { KommoService } from './kommo/KommoService';
import { KommoConfig, KommoLead, KommoAnalytics } from './kommo/types';

// Re-export types for backward compatibility
export type { KommoConfig, KommoLead, KommoAnalytics };

class KommoAPI {
  private static instance: KommoAPI;
  private config: KommoConfig | null = null;
  private service: KommoService | null = null;

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
        this.service = new KommoService(this.config);
      }
    } catch (error) {
      console.error('Failed to initialize Kommo API:', error);
      throw error;
    }
  }

  async getLeads(query?: { status_id?: number; page?: number }): Promise<KommoLead[]> {
    if (!this.service) {
      await this.initialize();
    }

    if (!this.service) {
      throw new Error('Kommo service not initialized');
    }

    try {
      return await this.service.getLeads(query);
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  async getAnalytics(startDate: Date, endDate: Date): Promise<KommoAnalytics> {
    if (!this.service) {
      await this.initialize();
    }

    if (!this.service) {
      throw new Error('Kommo service not initialized');
    }

    try {
      return await this.service.getAnalytics(startDate, endDate);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  async runDiagnostics() {
    if (!this.service) {
      await this.initialize();
    }

    if (!this.service) {
      throw new Error('Kommo service not initialized');
    }

    try {
      return await this.service.runDiagnostics();
    } catch (error) {
      console.error('Error running diagnostics:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.service) {
      await this.initialize();
    }

    if (!this.service) {
      throw new Error('Kommo service not initialized');
    }

    try {
      return await this.service.testConnection();
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }
}

export const kommoAPI = KommoAPI.getInstance();
export default kommoAPI;
