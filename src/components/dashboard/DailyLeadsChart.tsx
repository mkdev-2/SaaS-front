import React from 'react';
import { KommoLead } from '../../lib/kommo/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyLeadsChartProps {
  data: KommoLead[];
  period: string;
}

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

    const dateMap = new Map<string, { leads: number; value: number }>();
    
    data.forEach(lead => {
      const leadDate = new Date(lead.created_at * 1000);
      if (leadDate >= startDate) {
        const dateKey = leadDate.toLocaleDateString();
        const current = dateMap.get(dateKey) || { leads: 0, value: 0 };
        dateMap.set(dateKey, {
          leads: current.leads + 1,
          value: current.value + (lead.price || 0)
        });
      }
    });

    return Array.from(dateMap.entries()).map(([date, stats]) => ({
      date,
      leads: stats.leads,
      value: stats.value
    }));
  }, [data, period]);

  if (!chartData.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data available for the selected period
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" orientation="left" stroke="#4F46E5" />
          <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
          <Tooltip />
          <Bar yAxisId="left" dataKey="leads" fill="#4F46E5" name="Leads" />
          <Bar yAxisId="right" dataKey="value" fill="#10B981" name="Value" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}