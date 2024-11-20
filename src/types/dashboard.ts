export interface DateRange {
  start: Date;
  end: Date;
  compareStart: Date;
  compareEnd: Date;
  comparison: boolean;
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
  teamPerformance?: TeamPerformanceData;
  kommoAnalytics?: {
    currentStats: {
      totalLeads: number;
      vendas: number;
      valorVendas: number;
      ticketMedio: number;
      taxaConversao: number;
    };
    comparisonStats?: {
      totalLeads: number;
      vendas: number;
      valorVendas: number;
      ticketMedio: number;
      taxaConversao: number;
    };
    leads: Array<{
      id: number;
      name: string;
      status: string;
      statusColor: string;
      tipo: 'novo' | 'interacao';
      vendedor: string;
      value: string;
      created_at: string;
    }>;
  };
}

export interface TeamPerformanceData {
  vendorStats: Record<string, {
    totalLeads: number;
    activeLeads: number;
    proposals: number;
    sales: number;
    revenue: string;
    averageTicket: string;
    conversionRate: string;
    proposalRate: string;
  }>;
  history: Array<{
    date: string;
    metrics: {
      leads: number;
      revenue: string;
      sales: number;
    };
    vendorName: string;
  }>;
  goals: {
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
  };
}