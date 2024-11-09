import { createLogger } from '../../logger.js';
import { formatters } from './formatters.js';
import { PIPELINE_STATUS } from './constants.js';
import { 
  normalizeTags, 
  calculateLeadValue, 
  getContactInfo,
  getLeadStatus,
  identifyTagType,
  getLeadName 
} from './utils.js';

const logger = createLogger('KommoAnalytics');

export class KommoAnalytics {
  constructor(kommoClient) {
    if (!kommoClient?.get) {
      throw new Error('KommoClient inválido: método get não encontrado');
    }
    this.client = kommoClient;
    this.formatters = formatters;
    this.cache = new Map();
  }

  async getComprehensiveAnalytics(period = 15) {
    try {
      const cacheKey = `analytics_${period}`;
      const cachedData = this.cache.get(cacheKey);
      
      // Use cached data if available and less than 5 minutes old
      if (cachedData && (Date.now() - cachedData.timestamp) < 300000) {
        return cachedData.data;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (typeof period === 'number' ? period : 15));
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Fetch pipeline and leads in parallel
      const [pipelineResponse, leads] = await Promise.all([
        this.client.get('/leads/pipelines'),
        this.getDetailedLeads(startDate, endDate)
      ]);

      if (!pipelineResponse._embedded?.pipelines?.length) {
        throw new Error('Pipeline não encontrado');
      }

      const pipeline = pipelineResponse._embedded.pipelines[0];
      
      // Process all stats in parallel
      const [basicStats, dailyStats, vendorStats, personaStats] = await Promise.all([
        this.processBasicStats(leads, pipeline),
        this.processDailyStats(leads, pipeline),
        this.processVendorStats(leads),
        this.processPersonaStats(leads)
      ]);

      const result = {
        basicStats,
        detailedStats: {
          dailyStats,
          vendorStats,
          personaStats
        }
      };

      // Cache the results
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      logger.error('Erro na análise completa:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async getDetailedLeads(startDate, endDate) {
    const cacheKey = `leads_${startDate.getTime()}_${endDate.getTime()}`;
    const cachedLeads = this.cache.get(cacheKey);

    if (cachedLeads && (Date.now() - cachedLeads.timestamp) < 300000) {
      return cachedLeads.data;
    }

    try {
      // Fetch leads in batches of 50
      const batchSize = 50;
      let page = 1;
      let allLeads = [];

      while (true) {
        const response = await this.client.get('/leads', {
          params: {
            filter: {
              created_at: {
                from: Math.floor(startDate.getTime() / 1000),
                to: Math.floor(endDate.getTime() / 1000)
              }
            },
            with: [
              'contacts',
              'catalog_elements',
              'tags',
              'companies',
              'customers',
              'loss_reason',
              'pipeline',
              'status'
            ],
            page,
            limit: batchSize
          }
        });

        if (!response._embedded?.leads) break;

        const leads = response._embedded.leads;
        allLeads = allLeads.concat(leads);

        if (leads.length < batchSize) break;
        page++;
      }

      const processedLeads = allLeads.map(this.processLead);
      
      this.cache.set(cacheKey, {
        data: processedLeads,
        timestamp: Date.now()
      });

      return processedLeads;
    } catch (error) {
      logger.error('Erro ao buscar leads:', error);
      throw error;
    }
  }

  processLead = (lead) => {
    const status = getLeadStatus(lead.status_id);
    const tags = normalizeTags(lead.tags);
    const nome = getLeadName(lead);
    const contatos = lead.contacts?._embedded?.contacts || [];
    const valor = calculateLeadValue(lead);
    
    return {
      ...lead,
      nome,
      statusNome: status.nome,
      statusCor: status.cor,
      tags,
      contatos: contatos.map(getContactInfo),
      isVenda: lead.status_id === PIPELINE_STATUS.FECHAMENTO || 
              lead.status_id === PIPELINE_STATUS.POS_VENDAS,
      valor,
      vendedor: tags.find(tag => identifyTagType(tag.name) === 'VENDEDOR')?.name,
      persona: tags.find(tag => identifyTagType(tag.name) === 'PERSONA')?.name,
      origem: tags.find(tag => identifyTagType(tag.name) === 'ORIGEM')?.name
    };
  };

  async processBasicStats(leads, pipeline) {
    const periodStats = {
      day: this.getPeriodStats(leads, 1),
      week: this.getPeriodStats(leads, 7),
      fortnight: this.getPeriodStats(leads, 15)
    };

    return {
      periodStats,
      summary: this.getBasicStats(leads)
    };
  }

  async processDailyStats(leads, pipeline) {
    const dailyStats = {};
    
    leads.forEach(lead => {
      const createDate = this.formatters.date(lead.created_at).split(' ')[0];
      const updateDate = this.formatters.date(lead.updated_at).split(' ')[0];

      [createDate, updateDate].forEach(date => {
        if (!date) return;

        if (!dailyStats[date]) {
          dailyStats[date] = {
            total: 0,
            novosLeads: 0,
            interacoes: 0,
            propostas: 0,
            vendas: 0,
            valorVendas: 0,
            leads: new Set()
          };
        }

        const stats = dailyStats[date];
        stats.leads.add(lead.id);
        stats.total = stats.leads.size;

        if (date === createDate) {
          stats.novosLeads++;
        } else {
          stats.interacoes++;
        }

        if (lead.status_id === PIPELINE_STATUS.PROPOSTA_ENVIADA) {
          stats.propostas++;
        } else if (lead.isVenda) {
          stats.vendas++;
          stats.valorVendas += lead.valor;
        }
      });
    });

    // Format final stats
    return Object.entries(dailyStats).reduce((acc, [date, stats]) => {
      acc[date] = {
        total: stats.total,
        novosLeads: stats.novosLeads,
        interacoes: stats.interacoes,
        propostas: stats.propostas,
        vendas: stats.vendas,
        valorVendas: this.formatters.currency(stats.valorVendas),
        taxaInteracao: this.formatters.percentage(stats.interacoes, stats.total),
        taxaVendas: this.formatters.percentage(stats.vendas, stats.total),
        taxaPropostas: this.formatters.percentage(stats.propostas, stats.total)
      };
      return acc;
    }, {});
  }

  async processVendorStats(leads) {
    const vendorMap = new Map();

    leads.forEach(lead => {
      if (!lead.vendedor) return;

      if (!vendorMap.has(lead.vendedor)) {
        vendorMap.set(lead.vendedor, {
          totalAtendimentos: 0,
          propostas: 0,
          vendas: 0,
          valorVendas: 0
        });
      }

      const stats = vendorMap.get(lead.vendedor);
      stats.totalAtendimentos++;

      if (lead.status_id === PIPELINE_STATUS.PROPOSTA_ENVIADA) {
        stats.propostas++;
      } else if (lead.isVenda) {
        stats.vendas++;
        stats.valorVendas += lead.valor;
      }
    });

    return Array.from(vendorMap.entries()).reduce((acc, [vendedor, stats]) => {
      acc[vendedor] = {
        ...stats,
        valorVendas: this.formatters.currency(stats.valorVendas),
        taxaConversao: this.formatters.percentage(stats.vendas, stats.totalAtendimentos),
        taxaPropostas: this.formatters.percentage(stats.propostas, stats.totalAtendimentos)
      };
      return acc;
    }, {});
  }

  async processPersonaStats(leads) {
    const personaMap = new Map();
    const totalLeads = leads.length;

    leads.forEach(lead => {
      if (!lead.persona) return;

      if (!personaMap.has(lead.persona)) {
        personaMap.set(lead.persona, {
          quantity: 0,
          totalValue: 0
        });
      }

      const stats = personaMap.get(lead.persona);
      stats.quantity++;
      stats.totalValue += lead.valor;
    });

    return Array.from(personaMap.entries()).reduce((acc, [persona, stats]) => {
      acc[persona] = {
        quantity: stats.quantity,
        totalValue: this.formatters.currency(stats.totalValue),
        percentage: this.formatters.percentage(stats.quantity, totalLeads)
      };
      return acc;
    }, {});
  }

  getPeriodStats(leads, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    cutoffDate.setHours(0, 0, 0, 0);
    
    const periodLeads = leads.filter(lead => 
      new Date(lead.created_at * 1000) >= cutoffDate
    );

    const vendas = periodLeads.filter(lead => lead.isVenda);
    const valorTotalVendas = vendas.reduce((sum, lead) => sum + lead.valor, 0);

    return {
      totalLeads: periodLeads.length,
      vendas: vendas.length,
      valorVendas: this.formatters.currency(valorTotalVendas),
      taxaConversao: this.formatters.percentage(vendas.length, periodLeads.length)
    };
  }

  getBasicStats(leads) {
    const totalLeads = leads.length;
    const vendas = leads.filter(lead => lead.isVenda);
    const valorTotalVendas = vendas.reduce((sum, lead) => sum + lead.valor, 0);

    return {
      totalLeads,
      totalVendas: vendas.length,
      valorTotalVendas: this.formatters.currency(valorTotalVendas),
      taxaConversao: this.formatters.percentage(vendas.length, totalLeads)
    };
  }
}