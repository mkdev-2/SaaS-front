import { AxiosInstance } from 'axios';
import { KommoAnalytics, KommoLead } from './types';
import { logger } from '../logger';

export class KommoAnalyticsService {
  constructor(private client: AxiosInstance) {}

  async getAnalytics(startDate: Date, endDate: Date): Promise<KommoAnalytics> {
    try {
      const [leads, customFields] = await Promise.all([
        this.getLeadsInDateRange(startDate, endDate),
        this.getCustomFields()
      ]);

      const analytics = this.processLeadsData(leads, customFields);
      return analytics;
    } catch (error) {
      logger.error('Analytics error:', error);
      throw new Error('Failed to fetch analytics');
    }
  }

  async getLeadsInDateRange(startDate: Date, endDate: Date): Promise<KommoLead[]> {
    try {
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

      if (!response.data?._embedded?.leads) {
        logger.error('Invalid leads response:', response.data);
        return [];
      }

      return response.data._embedded.leads;
    } catch (error) {
      logger.error('Error fetching leads:', error);
      return [];
    }
  }

  async getCustomFields(): Promise<any[]> {
    try {
      const response = await this.client.get('/leads/custom_fields');
      
      if (!response.data?._embedded?.custom_fields) {
        logger.error('Invalid custom fields response:', response.data);
        return [];
      }

      return response.data._embedded.custom_fields;
    } catch (error) {
      logger.error('Error fetching custom fields:', error);
      return [];
    }
  }

  async getTodayLeads(): Promise<KommoLead[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.getLeadsInDateRange(today, new Date());
  }

  private processLeadsData(leads: KommoLead[], customFields: any[]): KommoAnalytics {
    const dailyLeads: Record<string, number> = {};
    const tags = {
      vendedor: {} as Record<string, number>,
      persona: {} as Record<string, number>,
      origem: {} as Record<string, number>
    };
    const purchases: KommoAnalytics['purchases'] = [];

    leads.forEach(lead => {
      // Process daily leads
      const date = new Date(lead.created_at * 1000).toISOString().split('T')[0];
      dailyLeads[date] = (dailyLeads[date] || 0) + 1;

      // Process custom fields
      lead.custom_fields_values?.forEach(field => {
        const customField = customFields.find(cf => cf.id === field.field_id);
        if (!customField) return;

        const value = field.values[0]?.value;
        if (!value) return;

        const fieldName = customField.name.toLowerCase();
        if (fieldName.includes('vendedor')) {
          tags.vendedor[value] = (tags.vendedor[value] || 0) + 1;
        } else if (fieldName.includes('persona')) {
          tags.persona[value] = (tags.persona[value] || 0) + 1;
        } else if (fieldName.includes('origem')) {
          tags.origem[value] = (tags.origem[value] || 0) + 1;
        }
      });

      // Process purchases
      if (lead.status_id === 142) { // Won/Closed status
        const persona = this.getLeadPersona(lead, customFields);
        const products = this.getLeadProducts(lead);
        const paymentMethod = this.getLeadPaymentMethod(lead, customFields);

        purchases.push({
          leadId: lead.id,
          persona,
          products,
          paymentMethod,
          purchaseDate: new Date(lead.closed_at * 1000).toISOString(),
          totalAmount: products.reduce((sum, product) => sum + (product.price * product.quantity), 0)
        });
      }
    });

    return { dailyLeads, tags, purchases };
  }

  private getLeadPersona(lead: KommoLead, customFields: any[]): string {
    const personaField = customFields.find(cf => 
      cf.name.toLowerCase().includes('persona')
    );
    if (!personaField) return 'Não definida';

    const fieldValue = lead.custom_fields_values?.find(field => 
      field.field_id === personaField.id
    );
    return fieldValue?.values[0]?.value || 'Não definida';
  }

  private getLeadProducts(lead: KommoLead): Array<{name: string; price: number; quantity: number}> {
    return lead.catalog_elements?.map(item => ({
      name: item.name,
      price: parseFloat(item.price || '0'),
      quantity: parseInt(item.quantity || '1', 10)
    })) || [];
  }

  private getLeadPaymentMethod(lead: KommoLead, customFields: any[]): string {
    const paymentField = customFields.find(cf => 
      cf.name.toLowerCase().includes('pagamento') || 
      cf.name.toLowerCase().includes('payment')
    );
    if (!paymentField) return 'Não informado';

    const fieldValue = lead.custom_fields_values?.find(field => 
      field.field_id === paymentField.id
    );
    return fieldValue?.values[0]?.value || 'Não informado';
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString('pt-BR');
  }

  formatPercentage(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  }
}