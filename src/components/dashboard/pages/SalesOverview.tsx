import React from 'react';
import { DollarSign, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import StatCard from '../StatCard';
import ConversionFunnelChart from '../ConversionFunnelChart';
import DailyLeadsChart from '../DailyLeadsChart';
import LeadsList from '../LeadsList';
import PeriodSelector from '../PeriodSelector';
import { useDashboardData } from '../../../hooks/useDashboardData';

export default function SalesOverview() {
  const [period, setPeriod] = React.useState('today');
  const { data, loading, error, isConnected } = useDashboardData();

  if (loading || !data?.kommoAnalytics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const analytics = data.kommoAnalytics;
  const periodStats = analytics.periodStats[period === 'today' ? 'day' : period === 'week' ? 'week' : 'fortnight'];
  const dailyStats = analytics.dailyStats || {};

  const stats = [
    {
      title: "Receita Total",
      value: periodStats.valorVendas,
      icon: DollarSign,
      color: "green",
      subtitle: `${periodStats.vendas} vendas realizadas`
    },
    {
      title: "Ticket Médio",
      value: `R$ ${(parseFloat(periodStats.valorVendas.replace('R$ ', '').replace('.', '').replace(',', '.')) / periodStats.vendas).toFixed(2)}`,
      icon: ShoppingBag,
      color: "blue",
      subtitle: "Por venda"
    },
    {
      title: "Taxa de Conversão",
      value: periodStats.taxaConversao,
      icon: TrendingUp,
      color: "indigo",
      subtitle: `De ${periodStats.totalLeads} leads`
    },
    {
      title: "Leads Ativos",
      value: periodStats.totalLeads,
      icon: Users,
      color: "purple",
      subtitle: "No período atual"
    }
  ];

  // Transformar dados diários em lista de leads
  const recentLeads = Object.entries(dailyStats)
    .flatMap(([date, stats]: [string, any]) => {
      if (!stats.leads) return [];
      return stats.leads.map((lead: any) => ({
        ...lead,
        created_at: date
      }));
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral de Vendas</h1>
          <p className="text-gray-500">
            Acompanhamento em tempo real do desempenho comercial
            {!isConnected && ' (Reconectando...)'}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyLeadsChart data={analytics} period={period} />
        <ConversionFunnelChart data={analytics} period={period} />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Leads Recentes</h2>
        </div>
        <div className="p-6">
          <LeadsList leads={recentLeads} />
        </div>
      </div>
    </div>
  );
}