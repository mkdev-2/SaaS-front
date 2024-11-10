import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface LeadSourceChartProps {
  data: any;
  period: string;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function LeadSourceChart({ data, period }: LeadSourceChartProps) {
  const sourceData = React.useMemo(() => {
    // Simulate source data since it's not in the original data
    return [
      { name: 'Website', value: 35, growth: '+12%' },
      { name: 'Referral', value: 25, growth: '+8%' },
      { name: 'Social Media', value: 20, growth: '+15%' },
      { name: 'Direct', value: 15, growth: '-3%' },
      { name: 'Other', value: 5, growth: '+1%' }
    ];
  }, [data, period]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Origem dos Leads</h2>
          <p className="text-sm text-gray-500">Distribuição por canal de aquisição</p>
        </div>
        <div className="p-2 bg-indigo-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Porcentagem']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          {sourceData.map((source, index) => (
            <div key={source.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-gray-900">{source.name}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{source.value}%</span>
                <span className={`text-sm font-medium ${
                  source.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {source.growth}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}