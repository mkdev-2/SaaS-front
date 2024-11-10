import React, { useState, Suspense } from 'react';
import { Users, Box, RefreshCw, AlertCircle, FileText, CheckCircle, TrendingUp } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardData } from '../types/dashboard';
import StatCard from './dashboard/StatCard';
import LeadsList from './dashboard/LeadsList';

const DailyLeadsChart = React.lazy(() => import('./dashboard/DailyLeadsChart'));
const VendorStats = React.lazy(() => import('./dashboard/VendorStats'));
const PersonaStats = React.lazy(() => import('./dashboard/PersonaStats'));
const PeriodSelector = React.lazy(() => import('./dashboard/PeriodSelector'));

function LoadingState() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mr-3" />
          <span className="text-gray-600">Carregando dados...</span>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Erro ao carregar dados
            </h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Nenhum dado disponível
            </h3>
            <p className="mt-2 text-sm text-yellow-700">
              Não há dados analíticos para exibir no momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStats(data: DashboardData | null, selectedPeriod: string) {
  const analytics = data?.kommoAnalytics;
  if (!analytics?.periodStats) return [];

  const periodStats = analytics.periodStats;
  const currentPeriodStats = periodStats[selectedPeriod === 'today' ? 'day' : selectedPeriod === 'week' ? 'week' : 'fortnight'];

  return [
    {
      title: "Total de Leads",
      value: currentPeriodStats.totalLeads,
      subtitle: `${currentPeriodStats.taxaConversao} taxa de conversão`,
      icon: Users,
      color: 'indigo'
    },
    {
      title: "Vendas",
      value: currentPeriodStats.vendas,
      subtitle: currentPeriodStats.valorVendas,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: "Performance",
      value: `${currentPeriodStats.taxaConversao}`,
      subtitle: "Taxa de conversão",
      icon: TrendingUp,
      color: 'blue'
    }
  ];
}

export default function Dashboard() {
  const { data, loading, error, refresh } = useDashboardData();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  if (loading && !data) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refresh} />;
  }

  if (!data?.kommoAnalytics) {
    return <EmptyState />;
  }

  const stats = getStats(data, selectedPeriod);
  const vendorStats = data.kommoAnalytics.vendorStats ? Object.entries(data.kommoAnalytics.vendorStats).map(([name, stats]: [string, any]) => ({
    name,
    atendimentos: stats.totalAtendimentos,
    propostas: stats.propostas,
    vendas: stats.vendas,
    valor: stats.valorVendas,
    taxaConversao: stats.taxaConversao,
    taxaPropostas: stats.taxaPropostas
  })) : [];

  const personaStats = data.kommoAnalytics.personaStats ? Object.entries(data.kommoAnalytics.personaStats).map(([name, stats]: [string, any]) => ({
    name,
    quantity: stats.quantity,
    value: stats.totalValue,
    percentage: stats.percentage
  })) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Vendas</h1>
          <p className="text-gray-500">Métricas de vendas e desempenho em tempo real</p>
        </div>
        <Suspense fallback={null}>
          <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {data.kommoAnalytics.dailyStats && (
        <Suspense fallback={
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="h-64 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          </div>
        }>
          <DailyLeadsChart 
            data={data.kommoAnalytics.dailyStats}
            period={selectedPeriod}
          />
        </Suspense>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vendorStats.length > 0 && (
          <Suspense fallback={
            <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          }>
            <VendorStats data={vendorStats} />
          </Suspense>
        )}

        {personaStats.length > 0 && (
          <Suspense fallback={
            <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          }>
            <PersonaStats data={personaStats} />
          </Suspense>
        )}
      </div>

      {data.kommoAnalytics.dailyStats && Object.values(data.kommoAnalytics.dailyStats).some(day => day.leads?.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads Recentes</h2>
          <LeadsList 
            leads={Object.values(data.kommoAnalytics.dailyStats)
              .flatMap(day => day.leads || [])
              .slice(0, 10)
            } 
          />
        </div>
      )}
    </div>
  );
}