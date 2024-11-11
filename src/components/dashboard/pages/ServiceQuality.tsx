import React from 'react';
import { Clock, MessageSquare, ThumbsUp, Timer } from 'lucide-react';
import StatCard from '../StatCard';
import PeriodSelector from '../PeriodSelector';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function ServiceQuality() {
  const [period, setPeriod] = React.useState('today');
  const { data, loading, error, isConnected } = useDashboardData();

  if (loading || !data?.kommoAnalytics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const analytics = data.kommoAnalytics;
  const dailyStats = analytics.dailyStats || {};

  // Exemplo de dados - idealmente viriam da API
  const stats = [
    {
      title: "Tempo Médio de Resposta",
      value: "8min",
      icon: Clock,
      color: "blue",
      subtitle: "Primeiro contato"
    },
    {
      title: "Taxa de Resposta",
      value: "94%",
      icon: MessageSquare,
      color: "green",
      subtitle: "Leads respondidos"
    },
    {
      title: "NPS",
      value: "8.7",
      icon: ThumbsUp,
      color: "indigo",
      subtitle: "Satisfação do cliente"
    },
    {
      title: "Tempo Médio de Conversão",
      value: "3.2 dias",
      icon: Timer,
      color: "purple",
      subtitle: "Lead para venda"
    }
  ];

  // Dados de tempo de resposta ao longo do dia
  const responseTimeData = [
    { hora: '08:00', tempo: 5 },
    { hora: '10:00', tempo: 8 },
    { hora: '12:00', tempo: 12 },
    { hora: '14:00', tempo: 6 },
    { hora: '16:00', tempo: 7 },
    { hora: '18:00', tempo: 9 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Qualidade do Atendimento</h1>
          <p className="text-gray-500">
            Métricas de tempo e satisfação
            {!isConnected && ' (Reconectando...)'}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Tempo de Resposta */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tempo de Resposta por Hora</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" />
                <YAxis unit="min" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="tempo" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  name="Tempo de Resposta"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição de NPS */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de NPS</h2>
          <div className="space-y-4">
            {[
              { label: 'Promotores (9-10)', value: 70, color: 'bg-green-500' },
              { label: 'Neutros (7-8)', value: 20, color: 'bg-yellow-500' },
              { label: 'Detratores (0-6)', value: 10, color: 'bg-red-500' }
            ].map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Desempenho por Vendedor */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Métricas por Vendedor</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tempo Médio Resposta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taxa de Resposta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NPS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leads Atendidos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { name: 'João Silva', responseTime: '5min', responseRate: '96%', nps: 9.1, leads: 45 },
                { name: 'Maria Santos', responseTime: '7min', responseRate: '94%', nps: 8.9, leads: 38 },
                { name: 'Pedro Costa', responseTime: '6min', responseRate: '92%', nps: 8.5, leads: 42 }
              ].map((vendor, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {vendor.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.responseTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.responseRate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.nps}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.leads}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}