import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DetailedStats } from '../../types/dashboard';

interface DailyLeadsChartProps {
  data: DetailedStats['dailyStats'] | undefined;
  period: string;
}

interface ChartDataPoint {
  date: string;
  leads: number;
  value: number;
  proposals: number;
  purchases: number;
}

const formatCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  // Remove 'R$ ' prefix and convert to number
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
        leads: stats.total || 0,
        value: stats.leads.reduce((sum, lead) => 
          sum + (lead.value ? formatCurrency(lead.value) : 0), 0
        ),
        proposals: stats.proposalsSent || 0,
        purchases: stats.purchases || 0
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads e Propostas por Dia</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Nenhum dado disponível para o período selecionado
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads e Propostas por Dia</h2>
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
                  case 'leads':
                    return [value, 'Leads'];
                  case 'proposals':
                    return [value, 'Propostas'];
                  case 'value':
                    return [`R$ ${value.toFixed(2)}`, 'Valor'];
                  case 'purchases':
                    return [value, 'Vendas'];
                  default:
                    return [value, name];
                }
              }}
            />
            <Bar yAxisId="left" dataKey="leads" fill="#4F46E5" name="Leads" />
            <Bar yAxisId="left" dataKey="proposals" fill="#F59E0B" name="Propostas" />
            <Bar yAxisId="right" dataKey="value" fill="#10B981" name="Valor" />
            <Bar yAxisId="left" dataKey="purchases" fill="#EF4444" name="Vendas" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}