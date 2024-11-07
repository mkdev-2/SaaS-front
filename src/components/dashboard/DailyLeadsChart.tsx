import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyLeadsChartProps {
  data: Array<{
    date: string;
    leads: number;
    value: number;
  }>;
  period: string;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export default function DailyLeadsChart({ data, period }: DailyLeadsChartProps) {
  const chartData = React.useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'fortnight':
        startDate.setDate(now.getDate() - 14);
        break;
      default: // today
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return data
      .filter(item => new Date(item.date) >= startDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, period]);

  if (!chartData.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Nenhum dado disponível para o período selecionado
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
          />
          <YAxis yAxisId="left" orientation="left" stroke="#4F46E5" />
          <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
          <Tooltip 
            labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
            formatter={(value: number, name: string) => [
              name === 'leads' ? value : formatCurrency(value),
              name === 'leads' ? 'Leads' : 'Valor'
            ]}
          />
          <Bar yAxisId="left" dataKey="leads" fill="#4F46E5" name="Leads" />
          <Bar yAxisId="right" dataKey="value" fill="#10B981" name="Valor" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}