import { createLogger } from '../../logger.js';
import { formatters } from './formatters.js';
import { PIPELINE_STATUS } from './constants.js';
import { 
  calculateLeadValue,
  findVendorTag,
  findSourceTag,
  getContactInfo,
  getLeadName,
  getLeadStatus,
  getLastInteraction,
  isLeadSale,
  normalizeStatus
} from './utils.js';

const logger = createLogger('KommoAnalytics');

// List of all possible vendors that should always be included
const ALL_VENDORS = [
  'Ana Paula Honorato',
  'Breno Santana',
  'Karla Bianca',
  'Rodrigo Ferreira',
  'Diuly',
  'Amanda Arouche',
  'Não atribuído'
];

export class KommoAnalytics {
  constructor(client) {
    if (!client?.get) {
      throw new Error('Invalid KommoClient: get method not found');
    }
    this.client = client;
    this.formatters = formatters;
  }

  async getComprehensiveAnalytics(startDate, endDate) {
    try {
      logger.info('Fetching comprehensive analytics', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const leads = await this.getDetailedLeads(startDate, endDate);
      const processedLeads = this.processLeads(leads);
      const dailyStats = this.processDailyStats(processedLeads);
      const vendorStats = await this.processVendorStats(processedLeads);
      const summary = this.calculateSummary(processedLeads);

      return {
        dailyStats,
        vendorStats,
        summary,
        leads: processedLeads
      };
    } catch (error) {
      logger.error('Error getting comprehensive analytics:', error);
      throw error;
    }
  }

  async getDetailedLeads(startDate, endDate) {
    try {
      const response = await this.client.get('/leads', {
        params: {
          filter: {
            created_at: {
              from: Math.floor(startDate.getTime() / 1000),
              to: Math.floor(endDate.getTime() / 1000)
            }
          },
          with: ['contacts', 'catalog_elements', 'custom_fields_values', 'sources', 'events', 'status']
        }
      });

      return response._embedded?.leads || [];
    } catch (error) {
      logger.error('Error fetching leads:', error);
      return [];
    }
  }

  processLeads(leads) {
    return leads.map(lead => {
      try {
        const valor = calculateLeadValue(lead);
        const vendedor = findVendorTag(lead) || 'Não atribuído';
        const status = getLeadStatus(lead);
        const lastInteraction = getLastInteraction(lead);
        const origem = findSourceTag(lead);
        const normalizedStatus = normalizeStatus(status.nome);

        return {
          id: lead.id,
          nome: getLeadName(lead),
          valor,
          vendedor,
          status: normalizedStatus,
          statusId: status.id,
          statusNome: status.nome,
          statusCor: status.cor,
          isVenda: isLeadSale(lead, normalizedStatus),
          contatos: getContactInfo(lead),
          origem,
          created_at: lead.created_at,
          last_interaction: lastInteraction
        };
      } catch (error) {
        logger.error('Error processing lead:', {
          leadId: lead.id,
          error: error.message
        });
        return {
          id: lead.id,
          nome: getLeadName(lead),
          valor: 0,
          vendedor: 'Não atribuído',
          status: 'Status Desconhecido',
          statusId: null,
          statusNome: 'Status Desconhecido',
          statusCor: '#808080',
          isVenda: false,
          contatos: getContactInfo(lead),
          origem: 'Origem não informada',
          created_at: lead.created_at,
          last_interaction: lead.created_at
        };
      }
    });
  }

  processDailyStats(leads) {
    const dailyStats = {};
    
    leads.forEach(lead => {
      const date = new Date(lead.created_at * 1000).toISOString().split('T')[0];
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          leads: [],
          totalLeads: 0,
          vendas: 0,
          valorTotal: 0,
          propostas: 0,
          interacoes: lead.last_interaction ? 1 : 0
        };
      }
      
      dailyStats[date].leads.push(lead);
      dailyStats[date].totalLeads++;
      
      if (lead.isVenda) {
        dailyStats[date].vendas++;
        dailyStats[date].valorTotal += lead.valor || 0;
      }

      if (lead.status === 'Proposta') {
        dailyStats[date].propostas++;
      }
    });

    return dailyStats;
  }

  calculateSummary(leads) {
    try {
      const vendas = leads.filter(lead => lead.isVenda);
      const valorTotal = vendas.reduce((sum, lead) => sum + (lead.valor || 0), 0);
      const ticketMedio = vendas.length > 0 ? valorTotal / vendas.length : 0;

      logger.info('Summary calculation:', {
        totalLeads: leads.length,
        totalVendas: vendas.length,
        valorTotal,
        ticketMedio
      });

      return {
        totalLeads: leads.length,
        totalVendas: vendas.length,
        valorTotal: this.formatters.currency(valorTotal),
        ticketMedio: this.formatters.currency(ticketMedio),
        taxaConversao: this.formatters.percentage(vendas.length, leads.length)
      };
    } catch (error) {
      logger.error('Error calculating summary:', error);
      return {
        totalLeads: leads.length,
        totalVendas: 0,
        valorTotal: this.formatters.currency(0),
        ticketMedio: this.formatters.currency(0),
        taxaConversao: this.formatters.percentage(0, leads.length)
      };
    }
  }

  async processVendorStats(leads) {
    // Initialize stats for all vendors
    const stats = ALL_VENDORS.reduce((acc, vendor) => {
      acc[vendor] = {
        totalLeads: 0,
        vendas: 0,
        valorVendas: 0,
        propostas: 0,
        leads: []
      };
      return acc;
    }, {});
    
    // Process leads
    leads.forEach(lead => {
      const vendedor = lead.vendedor || 'Não atribuído';
      
      if (!stats[vendedor]) {
        stats[vendedor] = {
          totalLeads: 0,
          vendas: 0,
          valorVendas: 0,
          propostas: 0,
          leads: []
        };
      }
      
      stats[vendedor].totalLeads++;
      stats[vendedor].leads.push(lead);
      
      if (lead.isVenda) {
        stats[vendedor].vendas++;
        stats[vendedor].valorVendas += lead.valor || 0;
      }

      if (lead.status === 'Proposta') {
        stats[vendedor].propostas++;
      }
    });

    // Format stats
    Object.keys(stats).forEach(vendedor => {
      const vendorStats = stats[vendedor];
      stats[vendedor] = {
        name: vendedor,
        totalLeads: vendorStats.totalLeads,
        activeLeads: vendorStats.leads.filter(l => !l.isVenda).length,
        proposals: vendorStats.propostas,
        sales: vendorStats.vendas,
        valorVendas: this.formatters.currency(vendorStats.valorVendas),
        taxaConversao: this.formatters.percentage(vendorStats.vendas, vendorStats.totalLeads),
        taxaPropostas: this.formatters.percentage(vendorStats.propostas, vendorStats.totalLeads),
        valorMedioVenda: this.formatters.currency(
          vendorStats.vendas > 0 ? vendorStats.valorVendas / vendorStats.vendas : 0
        ),
        valorTotal: this.formatters.currency(vendorStats.valorVendas),
        rawValues: {
          revenue: vendorStats.valorVendas,
          sales: vendorStats.vendas
        },
        leads: vendorStats.leads.map(lead => ({
          id: lead.id,
          nome: lead.nome,
          valor: this.formatters.currency(lead.valor),
          status: lead.statusNome,
          statusCor: lead.statusCor,
          contatos: lead.contatos,
          vendedor: lead.vendedor,
          origem: lead.origem,
          created_at: lead.created_at,
          last_interaction: lead.last_interaction
        }))
      };
    });

    return stats;
  }
}