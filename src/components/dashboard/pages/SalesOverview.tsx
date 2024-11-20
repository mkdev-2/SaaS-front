import React from 'react';
import { DollarSign, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import StatCard from '../StatCard';
import ConversionFunnelChart from '../ConversionFunnelChart';
import DailyLeadsChart from '../DailyLeadsChart';
import LeadsList from '../LeadsList';
import DateRangeSelector from '../DateRangeSelector';
import { useDashboardData } from '../../../hooks/useDashboardData';

export default function SalesOverview() {
  const { data, loading, error, isConnected, dateRange, setDateRange } = useDashboardData();

  if (loading || !data?.kommoAnalytics) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const analytics = data.kommoAnalytics;
  const { currentStats, comparisonStats } = analytics;

  const stats = [
    {
      title: "Receita Total",
      value: currentStats.valorVendas,
      change: comparisonStats ? `${((currentStats.valorVendas - comparisonStats.valorVendas) / comparisonStats.valorVendas * 100).toFixed(1)}%` : undefined,
      icon: DollarSign,
      color: "green",
      subtitle: `${currentStats.vendas} vendas realizadas`
    },
    {
      title: "Ticket Médio",
      value: currentStats.ticketMedio,
      change: comparisonStats ? `${((currentStats.ticketMedio - comparisonStats.ticketMedio) / comparisonStats.ticketMedio * 100).toFixed(1)}%` : undefined,
      icon: ShoppingBag,
      color: "blue",
      subtitle: "Por venda"
    },
    {
      title: "Taxa de Conversão",
      value: currentStats.taxaConversao,
      change: comparisonStats ? `${(currentStats.taxaConversao - comparisonStats.taxaConversao).toFixed(1)}%` : undefined,
      icon: TrendingUp,
      color: "indigo",
      subtitle: `De ${currentStats.totalLeads} leads`
    },
    {
      title: "Leads Ativos",
      value: currentStats.totalLeads,
      change: comparisonStats ? `${((currentStats.totalLeads - comparisonStats.totalLeads) / comparisonStats.totalLeads * 100).toFixed(1)}%` : undefined,
      icon: Users,
      color: "purple",
      subtitle: "No período selecionado"
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Visão Geral de Vendas</h1>
          <p className="text-sm sm:text-base text-gray-500">
            Acompanhamento em tempo real do desempenho comercial
            {!isConnected && ' (Reconectando...)'}
          </p>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <DailyLeadsChart data={analytics} dateRange={dateRange} />
        <ConversionFunnelChart data={analytics} dateRange={dateRange} />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Leads do Período</h2>
        </div>
        <div className="p-4 sm:p-6 overflow-x-auto">
          <LeadsList leads={analytics.leads} />
        </div>
      </div>
    </div>
  );
}