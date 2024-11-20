import React from 'react';
import { Users, Target, TrendingUp } from 'lucide-react';
import StatCard from '../StatCard';
import VendorStats from '../VendorStats';
import PerformanceTable from '../PerformanceTable';
import DaySelector from '../DaySelector';
import { useDashboardData } from '../../../hooks/useDashboardData';

export default function TeamPerformance() {
  const { data, loading, error, isConnected, dateRange, setDateRange } = useDashboardData();

  if (loading || !data?.teamPerformance) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { vendorStats = {}, goals = { monthly: {}, completion: {} } } = data.teamPerformance;

  const totalLeads = Object.values(vendorStats).reduce((sum, vendor) => 
    sum + (vendor.totalLeads || 0), 0);
  
  const totalSales = Object.values(vendorStats).reduce((sum, vendor) => 
    sum + (vendor.sales || 0), 0);

  const stats = [
    {
      title: "Total de Atendimentos",
      value: totalLeads,
      icon: Users,
      color: "blue",
      subtitle: `Meta: ${goals.monthly.leads || 0} leads`
    },
    {
      title: "Meta Atingida (Leads)",
      value: goals.completion.leads || '0%',
      icon: Target,
      color: "green",
      subtitle: `${totalSales} vendas realizadas`
    },
    {
      title: "Meta de Vendas",
      value: goals.completion.sales || '0%',
      icon: TrendingUp,
      color: "indigo",
      subtitle: `Meta mensal: ${goals.monthly.sales || 0} vendas`
    }
  ];

  const transformedVendorStats = Object.entries(vendorStats)
    .filter(([name]) => name !== 'Não atribuído')
    .map(([name, stats]) => ({
      name,
      atendimentos: stats.totalLeads || 0,
      propostas: stats.proposals || 0,
      vendas: stats.sales || 0,
      valor: stats.revenue || 'R$ 0,00',
      taxaConversao: stats.conversionRate || '0%',
      taxaPropostas: stats.proposalRate || '0%'
    }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance da Equipe</h1>
          <p className="text-gray-500">
            Análise detalhada do desempenho dos vendedores
            {!isConnected && ' (Reconectando...)'}
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
        <DaySelector value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {transformedVendorStats.length > 0 && (
          <VendorStats data={transformedVendorStats} />
        )}
        {data.teamPerformance && (
          <PerformanceTable data={data.teamPerformance} dateRange={dateRange} />
        )}
      </div>
    </div>
  );
}