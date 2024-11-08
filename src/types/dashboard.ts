export interface PeriodStats {
  totalLeads: number;
  purchases: number;
}

export interface BasicStats {
  periodStats: {
    day: PeriodStats;
    week: PeriodStats;
    fortnight: PeriodStats;
  };
}

export interface DetailedStats {
  dailyStats: Record<string, {
    total: number;
    newLeads: number;
    proposalsSent: number;
    purchases: number;
    purchaseValue: string;
    purchaseRate: string;
    proposalRate: string;
    leads: Array<{
      id: number;
      name: string;
      value: string;
      created_at: string;
      status: string;
      statusColor: string;
    }>;
  }>;
  vendorStats: Record<string, {
    totalLeads: number;
    activeLeads: number;
    totalPurchaseValue: string;
    activeRate: string;
  }>;
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