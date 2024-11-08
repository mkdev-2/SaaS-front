export interface VendorPerformance {
  totalAtendimentos: number;
  propostas: number;
  vendas: number;
  valorVendas: string;
  taxaConversao: string;
  taxaPropostas: string;
}

export interface LeadInteraction {
  id: number;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
  status: string;
  statusColor: string;
  tipo: 'novo' | 'interacao';
  vendedor: string;
}

export interface DailyMetrics {
  total: number;
  novosLeads: number;
  interacoes: number;
  propostas: number;
  vendas: number;
  valorVendas: string;
  taxaInteracao: string;
  taxaVendas: string;
  taxaPropostas: string;
  leads: LeadInteraction[];
}

export interface PeriodStats {
  totalLeads: number;
  vendas: number;
  valorVendas: string;
  taxaConversao: string;
}

export interface BasicStats {
  periodStats: {
    day: PeriodStats;
    week: PeriodStats;
    fortnight: PeriodStats;
  };
}

export interface DetailedStats {
  dailyStats: Record<string, DailyMetrics>;
  vendorStats: Record<string, VendorPerformance>;
  personaStats: Record<string, {
    quantity: number;
    totalValue: string;
    percentage: string;
  }>;
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
    id: string;
    accountDomain: string;
    clientId: string;
    createdAt: string;
  } | null;
  kommoAnalytics: (BasicStats & Partial<DetailedStats>) | null;
  isKommoConnected: boolean;
}