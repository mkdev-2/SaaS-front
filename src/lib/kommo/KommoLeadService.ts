import { AxiosInstance } from 'axios';
import { KommoLead } from './types';
import { logger } from '../logger';

export class KommoLeadService {
  constructor(private client: AxiosInstance) {}

  async getLeads(params?: any): Promise<KommoLead[]> {
    try {
      const response = await this.client.get('/leads', { params });
      return response.data._embedded?.leads || [];
    } catch (error) {
      logger.error('Error fetching leads:', error);
      throw new Error('Failed to fetch leads');
    }
  }

  async getLeadById(id: number): Promise<KommoLead> {
    try {
      const response = await this.client.get(`/leads/${id}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching lead:', error);
      throw new Error('Failed to fetch lead');
    }
  }
}