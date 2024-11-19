export interface PeriodStats {
  totalLeads: number;
  vendas: number;
  valorVendas: string;
  taxaConversao: string;
}

export interface DailyMetrics {
  total: number;
  novosLeads: number;
  interacoes: number;
  propostas: number;
  vendas: number;
  valorVendas: number;
  leads: LeadInteraction[];
}

export interface LeadInteraction {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  tipo: 'novo' | 'interacao';
  vendedor: string;
  value: string;
  created_at: string;
}

export interface VendorPerformance {
  name: string;
  metrics: {
    atendimentos: number;
    propostas: number;
    vendas: number;
    valor: string;
    taxaConversao: number;
    taxaPropostas: number;
    tendencia: 'up' | 'down';
  };
  historico: Array<{
    data: string;
    vendas: number;
    valor: number;
  }>;
}

export interface MarketingMetrics {
  custoTotal: string;
  custoPorLead: string;
  roi: string;
  leadsGerados: number;
}

export interface ServiceQualityMetrics {
  tempoMedioResposta: number;
  taxaResposta: number;
  nps: number;
  tempoMedioConversao: number;
}

export interface VendorStats {
  name: string;
  activeLeads: number;
  totalLeads: number;
  proposals: number;
  sales: number;
  revenue: string;
  averageTicket: string;
  conversionRate: string;
  proposalRate: string;
}

export interface VendorHistory {
  date: string;
  vendorName: string;
  metrics: {
    leads: number;
    sales: number;
    revenue: string;
  };
}

export interface Goals {
  monthly: {
    leads: number;
    sales: number;
    revenue: number;
  };
  completion: {
    leads: string;
    sales: string;
    revenue: string;
  };
}

export interface TeamPerformanceData {
  vendorStats: Record<string, VendorStats>;
  history: VendorHistory[];
  goals: Goals;
}

export interface DashboardData {
  projectCount: number;
  recentProjects: Array<{
    id: string;
    name: string;
    status: string;
    updatedAt: string;
  }>;
  automationRules: Array<{
    id: string;
    name: string;
    isActive: boolean;
    updatedAt: string;
  }>;
  kommoConfig: {
    accountDomain: string;
    connectedAt: string;
    isConnected: boolean;
  } | null;
  isKommoConnected: boolean;
  kommoAnalytics: {
    periodStats: {
      day: PeriodStats;
      week: PeriodStats;
      fortnight: PeriodStats;
    };
    dailyStats: Record<string, DailyMetrics>;
    vendorStats: Record<string, VendorPerformance>;
    personaStats: Record<string, {
      quantity: number;
      totalValue: string;
      vendas: number;
      percentage: number;
      averageTicket: string;
      conversionRate: number;
    }>;
    funnelStages: Array<{
      stage: string;
      count: number;
      conversionRate: number;
    }>;
    marketingMetrics: MarketingMetrics;
    serviceQuality: ServiceQualityMetrics;
  } | null;
  teamPerformance?: TeamPerformanceData;
}