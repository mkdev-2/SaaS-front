export interface DateRange {
  start: Date;
  end: Date;
  compareStart: Date;
  compareEnd: Date;
  comparison: boolean;
}

export interface LeadStatus {
  name: string;
  color: string;
  textColor: string;
}

export interface Lead {
  id: number;
  name: string;
  status: string;
  statusColor: string;
  tipo: 'novo' | 'interacao';
  vendedor: string;
  value: string;
  created_at: string;
}

export interface VendorStats {
  name: string;
  totalLeads: number;
  activeLeads: number;
  proposals: number;
  sales: number;
  valorVendas: string;
  taxaConversao: string;
  taxaPropostas: string;
  valorMedioVenda: string;
  valorTotal: string;
  rawValues: {
    revenue: number;
    sales: number;
  };
}

export interface DashboardData {
  currentStats: {
    totalLeads: number;
    totalVendas: number;
    valorTotal: string;
    ticketMedio: string;
    taxaConversao: string;
    leads: Array<{
      id: number;
      nome: string;
      status: string;
      statusCor: string;
      vendedor: string;
      valor: string;
      created_at: string;
    }>;
    vendedores: Record<string, VendorStats>;
  };
  comparisonStats?: {
    totalLeads: number;
    totalVendas: number;
    valorTotal: string;
    ticketMedio: string;
    taxaConversao: string;
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