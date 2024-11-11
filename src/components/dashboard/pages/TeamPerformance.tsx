import React from 'react';
import { Users, Target, TrendingUp } from 'lucide-react';
import StatCard from '../StatCard';
import VendorStats from '../VendorStats';
import PerformanceTable from '../PerformanceTable';
import PeriodSelector from '../PeriodSelector';
import { useDashboardData } from '../../../hooks/useDashboardData';

export default function TeamPerformance() {
  const [period, setPeriod] = React.useState('today');
  const { data, loading, error, isConnected } = useDashboardData();

  if (loading || !data?.kommoAnalytics) {
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

  const analytics = data.kommoAnalytics;
  const vendorStats = analytics.vendorStats || {};
  
  const totalAtendimentos = Object.values(vendorStats).reduce((sum, vendor: any) => sum + vendor.totalAtendimentos, 0);
  const totalVendas = Object.values(vendorStats).reduce((sum, vendor: any) => sum + vendor.vendas, 0);
  const mediaConversao = (totalVendas / totalAtendimentos * 100).toFixed(1);

  const stats = [
    {
      title: "Total de Atendimentos",
      value: totalAtendimentos,
      icon: Users,
      color: "blue",
      subtitle: "No período"
    },
    {
      title: "Média de Conversão",
      value: `${mediaConversao}%`,
      icon: Target,
      color: "green",
      subtitle: `${totalVendas} vendas realizadas`
    },
    {
      title: "Meta Atingida",
      value: "87%",
      icon: TrendingUp,
      color: "indigo",
      subtitle: "Meta mensal: R$ 100.000"
    }
  ];

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
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 gap-6">
        <VendorStats data={Object.entries(vendorStats).map(([name, stats]: [string, any]) => ({
          name,
          atendimentos: stats.totalAtendimentos,
          propostas: stats.propostas,
          vendas: stats.vendas,
          valor: stats.valorVendas,
          taxaConversao: stats.taxaConversao,
          taxaPropostas: stats.taxaPropostas
        }))} />
        <PerformanceTable data={analytics} period={period} />
      </div>
    </div>
  );
}