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
  value: string | number;
  change?: string;
  icon: React.ElementType;
}

function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  const isPositive = change ? !change.startsWith('-') : true;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
        {change && (
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
        )}
      </div>
      <h3 className="text-2xl font-bold mt-4">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
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

  const analytics = data?.kommo?.analytics;
  const periodStats = analytics?.periodStats || {
    day: { totalLeads: 0, purchases: 0 },
    week: { totalLeads: 0, purchases: 0 },
    fortnight: { totalLeads: 0, purchases: 0 }
  };

  const currentPeriodStats = periodStats[
    selectedPeriod === 'today' ? 'day' : 
    selectedPeriod === 'week' ? 'week' : 
    'fortnight'
  ];

  const stats = [
    {
      title: "Leads do Período",
      value: currentPeriodStats.totalLeads,
      icon: Users
    },
    {
      title: "Vendas Realizadas",
      value: currentPeriodStats.purchases,
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Erro ao carregar dados
              </h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={refresh}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Charts and detailed stats */}
      {analytics?.dailyStats && (
        <Suspense fallback={<LoadingChart />}>
          <DailyLeadsChart 
            data={Object.entries(analytics.dailyStats).map(([date, stats]) => ({
              date,
              leads: stats.total,
              value: stats.leads.reduce((sum: number, lead: any) => sum + (lead.price || 0), 0)
            }))}
            period={selectedPeriod}
          />
        </Suspense>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics?.vendorStats && (
          <Suspense fallback={<LoadingCard />}>
            <VendorStats 
              data={Object.entries(analytics.vendorStats)}
            />
          </Suspense>
        )}

        {analytics?.personaStats && (
          <Suspense fallback={<LoadingCard />}>
            <PersonaStats 
              data={Object.entries(analytics.personaStats)}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}