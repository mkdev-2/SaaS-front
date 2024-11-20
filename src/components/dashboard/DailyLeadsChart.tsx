import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DateRange } from '../../types/dashboard';

interface DailyLeadsChartProps {
  data: any;
  dateRange: DateRange;
}

export default function DailyLeadsChart({ data, dateRange }: DailyLeadsChartProps) {
  const chartData = React.useMemo(() => {
    if (!data?.leads) return [];

    const leads = data.leads;
    const dateStats: Record<string, any> = {};

    // Initialize the selected date with zero values
    const selectedDate = dateRange.start.toISOString().split('T')[0];
    dateStats[selectedDate] = {
      date: selectedDate,
      total: 0,
      valor: 0
    };

    // Aggregate leads by date
    leads.forEach((lead: any) => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      if (!dateStats[date]) {
        dateStats[date] = {
          date,
          total: 0,
          valor: 0
        };
      }
      dateStats[date].total += 1;
      dateStats[date].valor += parseFloat(lead.valor.replace('R$ ', '').replace('.', '').replace(',', '.')) || 0;
    });

    return Object.values(dateStats);
  }, [data, dateRange]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads por Data</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
              formatter={(value: number, name: string) => [
                name === 'total' ? value : `R$ ${value.toFixed(2)}`,
                name === 'total' ? 'Leads' : 'Valor'
              ]}
            />
            <Bar 
              yAxisId="left"
              dataKey="total" 
              fill="#4F46E5" 
              name="Leads"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="right"
              dataKey="valor" 
              fill="#10B981" 
              name="Valor"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
