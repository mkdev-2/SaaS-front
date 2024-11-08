export interface DailyStats {
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
}

export interface PeriodStats {
  totalLeads: number;
  purchases: number;
}

export interface Analytics {
  periodStats: {
    day: PeriodStats;
    week: PeriodStats;
    fortnight: PeriodStats;
  };
  dailyStats: Record<string, DailyStats>;
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
  kommo?: {
    analytics?: Analytics;
  };
}