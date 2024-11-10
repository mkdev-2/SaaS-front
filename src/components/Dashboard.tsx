import React, { useState, Suspense, useEffect } from 'react';
import { Users, Box, RefreshCw, AlertCircle, FileText, CheckCircle, TrendingUp } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
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
              Aguardando dados
            </h3>
            <p className="mt-2 text-sm text-yellow-700">
              Os dados estão sendo carregados em tempo real...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStats(data: any) {
  if (!data?.kommo?.analytics?.periodStats) {
    return [];
  }

  const { day: dayStats } = data.kommo.analytics.periodStats;

  return [
    {
      title: "Leads Ativos",
      value: dayStats.totalLeads,
      subtitle: `${dayStats.taxaConversao} de conversão`,
      icon: Users,
      color: 'indigo'
    },
    {
      title: "Vendas Realizadas",
      value: dayStats.totalVendas,
      subtitle: `Total: ${dayStats.valorTotalVendas}`,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: "Média por Venda",
      value: dayStats.valorTotalVendas,
      subtitle: "No período atual",
      icon: TrendingUp,
      color: 'blue'
    }
  ];
}

export default function Dashboard() {
  const { data, loading, error, refresh } = useDashboardData();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [hasInitialData, setHasInitialData] = useState(false);

  useEffect(() => {
    if (data?.kommo?.analytics?.periodStats) {
      setHasInitialData(true);
    }
  }, [data]);

  if (loading && !hasInitialData) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refresh} />;
  }

  if (!data?.kommo?.analytics?.periodStats) {
    return <EmptyState />;
  }

  const stats = getStats(data);

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

      <Suspense fallback={<div className="h-64 bg-gray-50 rounded-xl animate-pulse" />}>
        <DailyLeadsChart data={data.kommo.analytics} period={selectedPeriod} />
      </Suspense>

      {data.kommo.analytics.vendorStats && Object.keys(data.kommo.analytics.vendorStats).length > 0 && (
        <Suspense fallback={<div className="h-64 bg-gray-50 rounded-xl animate-pulse" />}>
          <VendorStats data={data.kommo.analytics.vendorStats} />
        </Suspense>
      )}

      {data.kommo.analytics.personaStats && Object.keys(data.kommo.analytics.personaStats).length > 0 && (
        <Suspense fallback={<div className="h-64 bg-gray-50 rounded-xl animate-pulse" />}>
          <PersonaStats data={data.kommo.analytics.personaStats} />
        </Suspense>
      )}
    </div>
  );
}