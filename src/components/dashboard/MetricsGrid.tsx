import React from 'react';
import { TrendingUp, TrendingDown, Clock, DollarSign, Users, Target } from 'lucide-react';

interface MetricsGridProps {
  data: any;
  period: string;
}

export default function MetricsGrid({ data, period }: MetricsGridProps) {
  const metrics = React.useMemo(() => [
    {
      title: 'Tempo Médio de Conversão',
      value: '3.2 dias',
      change: '-12%',
      description: 'Da captação até a venda',
      icon: Clock,
      color: 'blue'
    },
    {
      title: 'Taxa de Qualificação',
      value: '68%',
      change: '+5%',
      description: 'Leads qualificados',
      icon: Target,
      color: 'purple'
    },
    {
      title: 'Custo por Lead',
      value: 'R$ 45,00',
      change: '-8%',
      description: 'Média por aquisição',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Leads Ativos',
      value: '234',
      change: '+15%',
      description: 'Em negociação',
      icon: Users,
      color: 'amber'
    }
  ], []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className={`p-2 bg-${metric.color}-100 rounded-lg`}>
              <metric.icon className={`h-5 w-5 text-${metric.color}-600`} />
            </div>
            <span className={`flex items-center text-sm ${
              metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {metric.change}
              {metric.change.startsWith('+') ? (
                <TrendingUp className="h-4 w-4 ml-1" />
              ) : (
                <TrendingDown className="h-4 w-4 ml-1" />
              )}
            </span>
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