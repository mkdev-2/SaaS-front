import React, { useState, Suspense } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Box, Zap, RefreshCw, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';

// Lazy load components
const DailyLeadsChart = React.lazy(() => import('./dashboard/DailyLeadsChart'));
const VendorStats = React.lazy(() => import('./dashboard/VendorStats'));
const PersonaStats = React.lazy(() => import('./dashboard/PersonaStats'));
const PeriodSelector = React.lazy(() => import('./dashboard/PeriodSelector'));

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color?: string;
}

function StatCard({ title, value, change, icon: Icon, color = 'indigo' }: StatCardProps) {
  const isPositive = change ? !change.startsWith('-') : true;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className={`p-2 bg-${color}-100 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
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

  const analytics = data?.kommo?.analytics;

  if (loading && !data) {
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

  if (error) {
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
                onClick={refresh}
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

  if (!analytics) {
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

  const periodStats = analytics.periodStats || {
    day: { totalLeads: 0, purchases: 0 },
    week: { totalLeads: 0, purchases: 0 },
    fortnight: { totalLeads: 0, purchases: 0 }
  };

  const currentPeriodStats = periodStats[
    selectedPeriod === 'today' ? 'day' : 
    selectedPeriod === 'week' ? 'week' : 
    'fortnight'
  ];

  // Get current day stats
  const today = new Date().toLocaleDateString('pt-BR');
  const todayStats = analytics.dailyStats[today] || {
    total: 0,
    newLeads: 0,
    proposalsSent: 0,
    purchases: 0,
    purchaseValue: 'R$ 0,00',
    purchaseRate: '0%',
    proposalRate: '0%'
  };

  const stats = [
    {
      title: "Leads do Período",
      value: currentPeriodStats.totalLeads,
      icon: Users,
      color: 'indigo'
    },
    {
      title: "Propostas Enviadas",
      value: todayStats.proposalsSent,
      icon: FileText,
      color: 'blue'
    },
    {
      title: "Taxa de Conversão",
      value: todayStats.purchaseRate,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: "Valor Total",
      value: todayStats.purchaseValue,
      icon: Box,
      color: 'purple'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Charts */}
      {analytics.dailyStats && (
        <Suspense fallback={
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="h-64 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          </div>
        }>
          <DailyLeadsChart 
            data={analytics.dailyStats}
            period={selectedPeriod}
          />
        </Suspense>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics.vendorStats && (
          <Suspense fallback={
            <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          }>
            <VendorStats 
              data={Object.entries(analytics.vendorStats).map(([name, stats]) => ({
                name,
                leads: stats.totalLeads,
                active: stats.activeLeads,
                value: stats.totalPurchaseValue,
                rate: stats.activeRate
              }))}
            />
          </Suspense>
        )}

        {analytics.personaStats && (
          <Suspense fallback={
            <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          }>
            <PersonaStats 
              data={Object.entries(analytics.personaStats).map(([name, stats]) => ({
                name,
                quantity: stats.quantity,
                value: stats.totalValue,
                percentage: stats.percentage
              }))}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}