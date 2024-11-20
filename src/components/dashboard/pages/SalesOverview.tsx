import React from 'react';
import { DollarSign, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import StatCard from '../StatCard';
import ConversionFunnelChart from '../ConversionFunnelChart';
import DailyLeadsChart from '../DailyLeadsChart';
import LeadsList from '../LeadsList';
import DaySelector from '../DaySelector';
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
  const { stats, comparisonStats } = analytics;

  const getChangePercentage = (current: number, previous: number) => {
    if (!previous) return undefined;
    return `${((current - previous) / previous * 100).toFixed(1)}%`;
  };

  const statsConfig = [
    {
      title: "Receita Total",
      value: stats.valorVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      change: comparisonStats ? getChangePercentage(stats.valorVendas, comparisonStats.valorVendas) : undefined,
      icon: DollarSign,
      color: "green",
      subtitle: `${stats.vendas} vendas realizadas`
    },
    {
      title: "Ticket Médio",
      value: stats.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      change: comparisonStats ? getChangePercentage(stats.ticketMedio, comparisonStats.ticketMedio) : undefined,
      icon: ShoppingBag,
      color: "blue",
      subtitle: "Por venda"
    },
    {
      title: "Taxa de Conversão",
      value: `${stats.taxaConversao.toFixed(1)}%`,
      change: comparisonStats ? `${(stats.taxaConversao - comparisonStats.taxaConversao).toFixed(1)}%` : undefined,
      icon: TrendingUp,
      color: "indigo",
      subtitle: `De ${stats.totalLeads} leads`
    },
    {
      title: "Leads Ativos",
      value: stats.totalLeads,
      change: comparisonStats ? getChangePercentage(stats.totalLeads, comparisonStats.totalLeads) : undefined,
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
        <DaySelector value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsConfig.map((stat, index) => (
          <StatCard key={index} {...stat} />
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