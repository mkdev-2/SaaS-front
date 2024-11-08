import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyStats {
  total: number;
  newLeads: number;
  proposalsSent: number;
  purchases: number;
  purchaseValue: string;
  purchaseRate: string;
  proposalRate: string;
  leads: Array<{
    id: number;
    name: string;
    value: string;
    created_at: string;
    status: string;
    statusColor: string;
  }>;
}

interface DailyLeadsChartProps {
  data: Record<string, DailyStats>;
  period: string;
}

const formatCurrency = (value: string) => {
  // Remove 'R$ ' prefix and convert to number
  return parseFloat(value.replace('R$ ', '').replace('.', '').replace(',', '.'));
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

    return Object.entries(data)
      .map(([date, stats]) => ({
        date: date.replace(',', ''),
        leads: stats.total,
        value: stats.leads.reduce((sum, lead) => 
          sum + formatCurrency(lead.value), 0
        ),
        proposals: stats.proposalsSent,
        purchases: stats.purchases
      }))
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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads e Propostas por Dia</h2>
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
              formatter={(value: number, name: string) => {
                switch (name) {
                  case 'leads':
                    return [value, 'Leads'];
                  case 'proposals':
                    return [value, 'Propostas'];
                  case 'value':
                    return [`R$ ${value.toFixed(2)}`, 'Valor'];
                  default:
                    return [value, name];
                }
              }}
            />
            <Bar yAxisId="left" dataKey="leads" fill="#4F46E5" name="Leads" />
            <Bar yAxisId="left" dataKey="proposals" fill="#F59E0B" name="Propostas" />
            <Bar yAxisId="right" dataKey="value" fill="#10B981" name="Valor" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}