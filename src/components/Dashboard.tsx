import React, { useState, Suspense } from 'react';
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

function getStats(data: any) {
  if (!data?.kommo?.analytics?.metrics) {
    return [];
  }

  const { metrics, metadata } = data.kommo.analytics;
  const previousCount = metadata.previousLeadsCount || 1;
  const changePercentage = ((metadata.currentLeadsCount - previousCount) / previousCount * 100).toFixed(1);

  return [
    {
      title: "Leads Ativos",
      value: metrics.activeLeads,
      subtitle: `${changePercentage}% vs período anterior`,
      icon: Users,
      color: 'indigo'
    },
    {
      title: "Taxa de Qualificação",
      value: `${metrics.qualificationRate}%`,
      subtitle: `Custo por lead: R$ ${metrics.costPerLead}`,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: "Tempo de Conversão",
      value: `${metrics.conversionTime}h`,
      subtitle: "Média do período",
      icon: TrendingUp,
      color: 'blue'
    }
  ];
}

export default function Dashboard() {
  const { data, loading, error, refresh, isConnected } = useDashboardData();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Render loading state only on initial load
  if (loading && !data) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refresh} />;
  }

  // Always try to render data if we have it
  const stats = getStats(data);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Vendas</h1>
          <p className="text-gray-500">
            Métricas de vendas e desempenho em tempo real
            {!isConnected && ' (Reconectando...)'}
          </p>
        </div>
        <Suspense fallback={null}>
          <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
        </Suspense>
      </div>

      {stats.length > 0 ? (
        <>
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

          {data.kommo.analytics.funnel && data.kommo.analytics.funnel.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Funil de Vendas</h2>
              <div className="space-y-4">
                {data.kommo.analytics.funnel.map((stage, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-indigo-100 rounded-full">
                        <div
                          className="h-4 bg-indigo-600 rounded-full"
                          style={{ width: `${stage.conversionRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-gray-600">{stage.stage}</span>
                        <span className="text-sm font-medium text-gray-900">{stage.count}</span>
                      </div>
                    </div>
                    <span className="ml-4 text-sm text-gray-500">
                      {stage.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.kommo.analytics.vendorPerformance && data.kommo.analytics.vendorPerformance.length > 0 && (
            <Suspense fallback={<div className="h-64 bg-gray-50 rounded-xl animate-pulse" />}>
              <VendorStats data={data.kommo.analytics.vendorPerformance} />
            </Suspense>
          )}

          {data.kommo.analytics.sources && data.kommo.analytics.sources.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Origem dos Leads</h2>
              <div className="space-y-4">
                {data.kommo.analytics.sources.map((source: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{source.name}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900">{source.count}</span>
                      <span className="text-sm text-gray-500">{source.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Período da Análise</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Período Atual</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(data.kommo.analytics.metadata.dateRanges.current.start).toLocaleDateString()} até{' '}
                  {new Date(data.kommo.analytics.metadata.dateRanges.current.end).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Período Anterior</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(data.kommo.analytics.metadata.dateRanges.previous.start).toLocaleDateString()} até{' '}
                  {new Date(data.kommo.analytics.metadata.dateRanges.previous.end).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
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
      )}
    </div>
  );
}