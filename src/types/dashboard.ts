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
  kommoAnalytics?: {
    stats: {
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