import React, { useState, Suspense } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Box, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';

// Lazy load components
const DailyLeadsChart = React.lazy(() => import('./dashboard/DailyLeadsChart'));
const VendorStats = React.lazy(() => import('./dashboard/VendorStats'));
const PersonaStats = React.lazy(() => import('./dashboard/PersonaStats'));
const PurchaseStats = React.lazy(() => import('./dashboard/PurchaseStats'));
const PeriodSelector = React.lazy(() => import('./dashboard/PeriodSelector'));

function LoadingState() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
      <h3 className="text-lg font-medium text-gray-900">Carregando dados</h3>
      <p className="text-sm text-gray-500 mt-2">Aguarde enquanto carregamos as métricas do dashboard...</p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, refresh } = useDashboardData();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Early return for loading state
  if (loading && !data) {
    return <LoadingState />;
  }

  // Early return for error state
  if (error) {
    return <ErrorState error={error} onRetry={refresh} />;
  }

  // Check data structure
  if (!data?.kommo?.analytics?.periodStats) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Dados não disponíveis
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                Não foi possível carregar os dados do Kommo CRM. Verifique sua conexão e tente novamente.
              </p>
              <button
                onClick={refresh}
                className="mt-3 text-sm font-medium text-yellow-600 hover:text-yellow-500"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { periodStats, dailyStats = {}, vendorStats = {}, personaStats = {} } = data.kommo.analytics;

  // Calculate basic statistics
  const stats = [
    {
      title: "Leads do Período",
      value: periodStats[
        selectedPeriod === 'today' ? 'day' : 
        selectedPeriod === 'week' ? 'week' : 
        'fortnight'
      ].totalLeads,
      previousValue: 0,
      icon: Users
    },
    {
      title: "Vendas Realizadas",
      value: periodStats[
        selectedPeriod === 'today' ? 'day' : 
        selectedPeriod === 'week' ? 'week' : 
        'fortnight'
      ].purchases,
      previousValue: 0,
      icon: Box
    }
  ];

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value.toString()}
            change={`${((stat.value - (stat.previousValue || 0)) / (stat.previousValue || 1) * 100).toFixed(1)}%`}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Charts and detailed stats */}
      <Suspense fallback={<LoadingChart />}>
        <DailyLeadsChart 
          data={Object.entries(dailyStats).map(([date, stats]) => ({
            date,
            leads: stats.total,
            value: stats.leads.reduce((sum: number, lead: any) => sum + (lead.price || 0), 0)
          }))}
          period={selectedPeriod}
        />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<LoadingCard />}>
          <VendorStats 
            data={Object.entries(vendorStats)}
          />
        </Suspense>

        <Suspense fallback={<LoadingCard />}>
          <PersonaStats 
            data={Object.entries(personaStats)}
          />
        </Suspense>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

function LoadingChart() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="h-64 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
}

function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  const isPositive = !change.startsWith('-');
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
        <span className={`flex items-center text-sm ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {change}
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 ml-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 ml-1" />
          )}
        </span>
      </div>
      <h3 className="text-2xl font-bold mt-4">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </div>
  );
}