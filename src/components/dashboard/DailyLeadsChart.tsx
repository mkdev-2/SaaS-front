import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DetailedStats } from '../../types/dashboard';

interface DailyLeadsChartProps {
  data: any;
  period: string;
}

const formatCurrency = (value: string | number): number => {
  if (typeof value === 'string') {
    return parseFloat(value.replace('R$ ', '').replace('.', '').replace(',', '.'));
  }
  return value;
};

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

export default function DailyLeadsChart({ data, period }: DailyLeadsChartProps) {
  const chartData = React.useMemo(() => {
    if (!data?.dailyStats) return [];

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

    return Object.entries(data.dailyStats)
      .map(([date, stats]: [string, any]) => ({
        date,
        novosLeads: stats.novosLeads || 0,
        interacoes: stats.interacoes || 0,
        propostas: stats.propostas || 0,
        vendas: stats.vendas || 0,
        valor: formatCurrency(stats.valorVendas || 0)
      }))
      .filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, period]);

  if (!chartData.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads e Interações por Dia</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Nenhum dado disponível para o período selecionado
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads e Interações por Dia</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="left" orientation="left" stroke="#4F46E5" />
            <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
            <Tooltip 
              labelFormatter={formatDate}
              formatter={(value: number, name: string) => {
                switch (name) {
                  case 'novosLeads':
                    return [value, 'Novos Leads'];
                  case 'interacoes':
                    return [value, 'Interações'];
                  case 'propostas':
                    return [value, 'Propostas'];
                  case 'vendas':
                    return [value, 'Vendas'];
                  case 'valor':
                    return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor'];
                  default:
                    return [value, name];
                }
              }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="novosLeads" 
              fill="#4F46E5" 
              name="Novos Leads"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="left" 
              dataKey="interacoes" 
              fill="#8B5CF6" 
              name="Interações"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="left" 
              dataKey="propostas" 
              fill="#F59E0B" 
              name="Propostas"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="left" 
              dataKey="vendas" 
              fill="#10B981" 
              name="Vendas"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="right" 
              dataKey="valor" 
              fill="#6366F1" 
              name="Valor"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}