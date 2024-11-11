import React from 'react';
import { Target, TrendingUp, DollarSign } from 'lucide-react';
import StatCard from '../StatCard';
import LeadSourceChart from '../LeadSourceChart';
import PersonaStats from '../PersonaStats';
import PeriodSelector from '../PeriodSelector';
import { useDashboardData } from '../../../hooks/useDashboardData';

export default function MarketingAnalytics() {
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
  const periodStats = analytics.periodStats[period === 'today' ? 'day' : period === 'week' ? 'week' : 'fortnight'];
  
  const custoPorLead = 25; // Exemplo fixo, idealmente viria da API
  const custoTotal = periodStats.totalLeads * custoPorLead;
  const roi = ((parseFloat(periodStats.valorVendas.replace('R$ ', '').replace('.', '').replace(',', '.')) - custoTotal) / custoTotal * 100).toFixed(1);

  const stats = [
    {
      title: "ROI das Campanhas",
      value: `${roi}%`,
      icon: TrendingUp,
      color: "green",
      subtitle: `R$ ${custoTotal.toFixed(2)} investidos`
    },
    {
      title: "Custo por Lead",
      value: `R$ ${custoPorLead.toFixed(2)}`,
      icon: DollarSign,
      color: "blue",
      subtitle: `${periodStats.totalLeads} leads gerados`
    },
    {
      title: "Taxa de Conversão",
      value: periodStats.taxaConversao,
      icon: Target,
      color: "indigo",
      subtitle: "Lead para Venda"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics de Marketing</h1>
          <p className="text-gray-500">
            Análise de campanhas e performance de marketing
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadSourceChart data={analytics} period={period} />
        <PersonaStats data={Object.entries(analytics.personaStats || {}).map(([name, stats]: [string, any]) => ({
          name,
          quantity: stats.quantity,
          value: stats.totalValue,
          percentage: stats.percentage
        }))} />
      </div>
    </div>
  );
}