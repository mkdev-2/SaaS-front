import React from 'react';
import { Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PersonaStatsProps {
  data: [string, number][];
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function PersonaStats({ data }: PersonaStatsProps) {
  const chartData = React.useMemo(() => {
    return data.map(([name, value]) => ({
      name,
      value
    }));
  }, [data]);

  const totalLeads = React.useMemo(() => {
    return data.reduce((sum, [_, count]) => sum + count, 0);
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Distribuição por Persona</h2>
          <p className="text-sm text-gray-500">{totalLeads} leads no total</p>
        </div>
        <div className="p-2 bg-purple-100 rounded-lg">
          <Users className="h-5 w-5 text-purple-600" />
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-600">{entry.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {((entry.value / totalLeads) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}