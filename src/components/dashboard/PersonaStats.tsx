import React from 'react';
import { Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PersonaData {
  name: string;
  quantity: number;
  value: string;
  percentage: string;
}

interface PersonaStatsProps {
  data: PersonaData[];
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function PersonaStats({ data }: PersonaStatsProps) {
  const chartData = React.useMemo(() => {
    return data.map(item => ({
      name: item.name,
      value: item.quantity
    }));
  }, [data]);

  const totalLeads = React.useMemo(() => {
    return data.reduce((sum, item) => sum + item.quantity, 0);
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
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900 mr-2">
                {item.value}
              </span>
              <span className="text-sm text-gray-500">
                ({item.percentage})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}