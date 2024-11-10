import React from 'react';
import { Clock, DollarSign, Users, Target } from 'lucide-react';

interface MetricsGridProps {
  data: any;
  period: string;
}

export default function MetricsGrid({ data, period }: MetricsGridProps) {
  const periodStats = data.periodStats[period === 'today' ? 'day' : period === 'week' ? 'week' : 'fortnight'];
  const dailyStats = Object.values(data.dailyStats || {}).reduce((acc: any, day: any) => {
    acc.interacoes += day.interacoes || 0;
    acc.propostas += day.propostas || 0;
    return acc;
  }, { interacoes: 0, propostas: 0 });

  const metrics = React.useMemo(() => [
    {
      title: 'Taxa de Interação',
      value: `${((dailyStats.interacoes / periodStats.totalLeads) * 100).toFixed(1)}%`,
      description: 'Leads com interação',
      icon: Clock,
      color: 'blue'
    },
    {
      title: 'Taxa de Propostas',
      value: `${((dailyStats.propostas / periodStats.totalLeads) * 100).toFixed(1)}%`,
      description: 'Leads com proposta',
      icon: Target,
      color: 'purple'
    },
    {
      title: 'Valor Médio',
      value: periodStats.valorVendas,
      description: 'Por venda realizada',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Leads Ativos',
      value: periodStats.totalLeads,
      description: 'No período',
      icon: Users,
      color: 'amber'
    }
  ], [periodStats, dailyStats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className={`p-2 bg-${metric.color}-100 rounded-lg`}>
              <metric.icon className={`h-5 w-5 text-${metric.color}-600`} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
            <p className="text-sm text-gray-500 mt-1">{metric.title}</p>
            <p className="text-xs text-gray-400 mt-1">{metric.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}