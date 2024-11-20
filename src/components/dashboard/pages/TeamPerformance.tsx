import React from 'react';
import { Users, Target, TrendingUp } from 'lucide-react';
import StatCard from '../StatCard';
import VendorStats from '../VendorStats';
import PerformanceTable from '../PerformanceTable';
import DaySelector from '../DaySelector';
import { useDashboardData } from '../../../hooks/useDashboardData';

export default function TeamPerformance() {
  const { data, loading, error, isConnected, dateRange, setDateRange } = useDashboardData();

  if (loading || !data?.currentStats) {
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

  const { currentStats } = data;
  const vendedores = currentStats.vendedores || {};

  const totalLeads = Object.values(vendedores).reduce((sum: number, vendor: any) => 
    sum + (vendor.totalLeads || 0), 0);
  
  const totalVendas = Object.values(vendedores).reduce((sum: number, vendor: any) => 
    sum + (vendor.sales || 0), 0);

  const stats = [
    {
      title: "Total de Atendimentos",
      value: totalLeads,
      icon: Users,
      color: "blue",
      subtitle: `${Object.keys(vendedores).length} vendedores ativos`
    },
    {
      title: "Vendas Realizadas",
      value: totalVendas,
      icon: Target,
      color: "green",
      subtitle: currentStats.valorTotal
    },
    {
      title: "Taxa de Conversão",
      value: currentStats.taxaConversao,
      icon: TrendingUp,
      color: "indigo",
      subtitle: `${currentStats.totalVendas} de ${currentStats.totalLeads} leads`
    }
  ];

  const transformedVendorStats = Object.entries(vendedores)
    .filter(([name]) => name !== 'Não atribuído')
    .map(([name, stats]: [string, any]) => ({
      name,
      atendimentos: stats.totalLeads || 0,
      propostas: stats.proposals || 0,
      vendas: stats.sales || 0,
      valor: stats.valorVendas || 'R$ 0,00',
      taxaConversao: stats.taxaConversao || '0%',
      taxaPropostas: stats.taxaPropostas || '0%'
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
      </div>
    </div>
  );
}