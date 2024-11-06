import { AxiosInstance } from 'axios';
import { KommoAnalytics, KommoLead } from './types';
import { logger } from '../logger';

export class KommoAnalyticsService {
  constructor(private client: AxiosInstance) {}

  async getAnalytics(startDate: Date, endDate: Date): Promise<KommoAnalytics> {
    try {
      const [leads, tags, customFields] = await Promise.all([
        this.getLeadsInDateRange(startDate, endDate),
        this.getTags(),
        this.getCustomFields()
      ]);

      return {
        dailyLeads: this.analyzeDailyLeads(leads),
        tags: this.analyzeLeadTags(leads, tags),
        purchases: await this.analyzePurchases(leads, customFields)
      };
    } catch (error) {
      logger.error('Analytics error:', error);
      throw new Error('Failed to fetch analytics');
    }
  }

  private async getLeadsInDateRange(startDate: Date, endDate: Date) {
    const response = await this.client.get('/leads', {
      params: {
        filter: {
          created_at: {
            from: Math.floor(startDate.getTime() / 1000),
            to: Math.floor(endDate.getTime() / 1000)
          }
        },
        with: ['contacts', 'catalog_elements', 'custom_fields_values']
      }
    });
    return response.data._embedded.leads;
  }

  private async getTags() {
    const response = await this.client.get('/leads/tags');
    return response.data._embedded.tags;
  }

  private async getCustomFields() {
    const response = await this.client.get('/leads/custom_fields');
    return response.data._embedded.custom_fields;
  }

  private analyzeDailyLeads(leads: KommoLead[]) {
    return leads.reduce((acc, lead) => {
      const date = new Date(lead.created_at * 1000).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private analyzeLeadTags(leads: KommoLead[], tags: any[]) {
    const tagTypes = {
      vendedor: new Set(['vendedor', 'responsável', 'atendente']),
      persona: new Set(['persona', 'perfil', 'tipo-cliente']),
      origem: new Set(['origem', 'source', 'canal'])
    };

    const analytics = {
      vendedor: {} as Record<string, number>,
      persona: {} as Record<string, number>,
      origem: {} as Record<string, number>
    };

    leads.forEach(lead => {
      if (!lead.tags) return;

      lead.tags.forEach(leadTag => {
        const tag = tags.find(t => t.id === leadTag.id);
        if (!tag) return;

        const tagName = tag.name.toLowerCase();
        Object.entries(tagTypes).forEach(([type, keywords]) => {
          if ([...keywords].some(keyword => tagName.includes(keyword))) {
            analytics[type as keyof typeof analytics][tag.name] = 
              (analytics[type as keyof typeof analytics][tag.name] || 0) + 1;
          }
        });
      });
    });

    return analytics;
  }

  private async analyzePurchases(leads: KommoLead[], customFields: any[]) {
    const purchaseStatusId = await this.getPurchaseStatusId();
    const paymentFieldId = this.findPaymentFieldId(customFields);

    return leads
      .filter(lead => lead.status_id === purchaseStatusId)
      .map(lead => ({
        leadId: lead.id,
        persona: this.getPersonaFromTags(lead.tags),
        products: this.getProducts(lead),
        paymentMethod: this.getPaymentMethod(lead, paymentFieldId),
        purchaseDate: new Date(lead.closed_at * 1000).toISOString(),
        totalAmount: this.calculateTotalAmount(lead)
      }));
  }

  private async getPurchaseStatusId() {
    try {
      const response = await this.client.get('/leads/pipelines');
      const statuses = response.data._embedded.pipelines[0]._embedded.statuses;
      return statuses.find((status: any) => 
        status.name.toLowerCase().includes('ganho') || 
        status.name.toLowerCase().includes('won'))?.id || null;
    } catch (error) {
      logger.error('Error getting purchase status:', error);
      return null;
    }
  }

  private findPaymentFieldId(customFields: any[]) {
    return customFields.find(field => 
      field.name.toLowerCase().includes('pagamento') || 
      field.name.toLowerCase().includes('payment'))?.id;
  }

  private getPaymentMethod(lead: KommoLead, paymentFieldId: number) {
    if (!paymentFieldId) return 'Não informado';
    
    const paymentField = lead.custom_fields_values?.find(field => 
      field.field_id === paymentFieldId);
    
    return paymentField?.values[0]?.value || 'Não informado';
  }

  private getPersonaFromTags(tags: any[]) {
    if (!tags) return 'Não definida';
    
    const personaTag = tags.find(tag => 
      tag.name.toLowerCase().includes('persona'));
    
    return personaTag?.name || 'Não definida';
  }

  private getProducts(lead: KommoLead) {
    return lead.catalog_elements?.map(item => ({
      name: item.name,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity || '1', 10)
    })) || [];
  }

  private calculateTotalAmount(lead: KommoLead) {
    const products = this.getProducts(lead);
    return products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
}