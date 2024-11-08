import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DetailedStats } from '../../types/dashboard';

interface DailyLeadsChartProps {
  data: DetailedStats['dailyStats'] | undefined;
  period: string;
}

interface ChartDataPoint {
  date: string;
  novosLeads: number;
  interacoes: number;
  propostas: number;
  vendas: number;
  valor: number;
}

const formatCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  return parseFloat(value.replace('R$ ', '').replace('.', '').replace(',', '.'));
};

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch (e) {
    return dateStr;
  }
};

export default function DailyLeadsChart({ data, period }: DailyLeadsChartProps) {
  const chartData = React.useMemo(() => {
    if (!data) return [];

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

    return Object.entries(data)
      .map(([date, stats]): ChartDataPoint => ({
        date,
        novosLeads: stats.novosLeads || 0,
        interacoes: stats.interacoes || 0,
        propostas: stats.propostas || 0,
        vendas: stats.vendas || 0,
        valor: formatCurrency(stats.valorVendas)
      }))
      .filter(item => {
        try {
          return new Date(item.date) >= startDate;
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => {
        try {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } catch (e) {
          return 0;
        }
      });
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
                    return [`R$ ${value.toFixed(2)}`, 'Valor'];
                  default:
                    return [value, name];
                }
              }}
            />
            <Bar yAxisId="left" dataKey="novosLeads" fill="#4F46E5" name="Novos Leads" />
            <Bar yAxisId="left" dataKey="interacoes" fill="#8B5CF6" name="Interações" />
            <Bar yAxisId="left" dataKey="propostas" fill="#F59E0B" name="Propostas" />
            <Bar yAxisId="left" dataKey="vendas" fill="#10B981" name="Vendas" />
            <Bar yAxisId="right" dataKey="valor" fill="#6366F1" name="Valor" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}