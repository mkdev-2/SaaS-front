import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface LeadSourceChartProps {
  data: {
    leads: Array<{
      origem: string;
    }>;
  };
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function LeadSourceChart({ data }: LeadSourceChartProps) {
  const sourceData = React.useMemo(() => {
    const sources: Record<string, number> = {};
    
    data.leads.forEach(lead => {
      const source = lead.origem || 'Origem não informada';
      sources[source] = (sources[source] || 0) + 1;
    });

    return Object.entries(sources)
      .filter(([name]) => name !== 'Origem não informada')
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => b.value - a.value);
  }, [data.leads]);

  if (!sourceData.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center text-gray-500">
          Nenhuma origem de lead identificada no período
        </div>
      </div>
    );
  }

  const total = sourceData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Origem dos Leads</h2>
          <p className="text-sm text-gray-500">{total} leads no total</p>
        </div>
        <div className="p-2 bg-indigo-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
        </div>
      </div>

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
              {sourceData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} leads`, 'Quantidade']}
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

      <div className="mt-4 space-y-2">
        {sourceData.map((source, index) => (
          <div key={source.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-600">{source.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900 mr-2">
                {source.value} leads
              </span>
              <span className="text-sm text-gray-500">
                ({((source.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}