import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowDownRight } from 'lucide-react';

interface ConversionFunnelChartProps {
  data: any;
  period: string;
}

export default function ConversionFunnelChart({ data, period }: ConversionFunnelChartProps) {
  const funnelData = React.useMemo(() => {
    const periodStats = data.periodStats[period === 'today' ? 'day' : period === 'week' ? 'week' : 'fortnight'];
    const dailyStats = Object.values(data.dailyStats || {}).reduce((acc: any, day: any) => {
      acc.propostas += day.propostas || 0;
      acc.interacoes += day.interacoes || 0;
      return acc;
    }, { propostas: 0, interacoes: 0 });
    
    return [
      {
        stage: 'Leads',
        value: periodStats.totalLeads,
        color: '#4F46E5'
      },
      {
        stage: 'Interações',
        value: dailyStats.interacoes,
        color: '#7C3AED'
      },
      {
        stage: 'Propostas',
        value: dailyStats.propostas,
        color: '#EC4899'
      },
      {
        stage: 'Vendas',
        value: periodStats.vendas,
        color: '#10B981'
      }
    ];
  }, [data, period]);

  const conversionRate = ((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Funil de Conversão</h2>
          <div className="flex items-center mt-1">
            <span className="text-sm text-gray-500">Taxa de Conversão Total:</span>
            <span className="ml-2 text-sm font-medium text-green-600">{conversionRate}%</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={funnelData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis 
              dataKey="stage" 
              type="category"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number, name: string) => [value, 'Quantidade']}
              labelStyle={{ color: '#111827' }}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '0.375rem'
              }}
            />
            <Bar 
              dataKey="value"
              fill="#4F46E5"
              radius={[0, 4, 4, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {funnelData.slice(0, -1).map((stage, index) => {
          const dropoff = (1 - (funnelData[index + 1].value / stage.value)) * 100;
          return (
            <div key={stage.stage} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{stage.stage} → {funnelData[index + 1].stage}</span>
              <div className="flex items-center">
                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm font-medium text-red-500">
                  {dropoff.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}