import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Box, Zap, RefreshCw, AlertCircle, Tags, ShoppingBag, DollarSign } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import DailyLeadsChart from './dashboard/DailyLeadsChart';
import VendorStats from './dashboard/VendorStats';
import PersonaStats from './dashboard/PersonaStats';
import PurchaseStats from './dashboard/PurchaseStats';
import PeriodSelector from './dashboard/PeriodSelector';

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export default function Dashboard() {
  const { data, loading, error, refresh } = useDashboardData();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Extrair dados do período selecionado
  const periodStats = React.useMemo(() => {
    if (!data?.kommo?.analytics?.periodStats) return null;
    return data.kommo.analytics.periodStats[
      selectedPeriod === 'today' ? 'day' : 
      selectedPeriod === 'week' ? 'week' : 
      'fortnight'
    ];
  }, [data, selectedPeriod]);

  // Calcular estatísticas
  const stats = React.useMemo(() => {
    if (!periodStats) return [];

    return [
      {
        title: "Leads do Período",
        value: periodStats.totalLeads || 0,
        previousValue: 0,
        icon: Users
      },
      {
        title: "Vendas Realizadas",
        value: periodStats.purchases || 0,
        previousValue: 0,
        icon: ShoppingBag
      },
      {
        title: "Vendedores Ativos",
        value: Object.keys(data?.kommo?.analytics?.vendorStats || {}).length,
        previousValue: 0,
        icon: Users
      },
      {
        title: "Total de Personas",
        value: Object.keys(data?.kommo?.analytics?.personaStats || {}).length,
        previousValue: 0,
        icon: Tags
      }
    ];
  }, [data, periodStats]);

  // Preparar dados do gráfico
  const chartData = React.useMemo(() => {
    if (!data?.kommo?.analytics?.dailyStats) return [];

    return Object.entries(data.kommo.analytics.dailyStats)
      .map(([date, stats]) => ({
        date,
        leads: stats.total,
        value: stats.leads.reduce((sum, lead) => sum + (lead.price || 0), 0)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  // Preparar dados dos vendedores
  const vendorData = React.useMemo(() => {
    if (!data?.kommo?.analytics?.vendorStats) return [];

    return Object.entries(data.kommo.analytics.vendorStats)
      .map(([name, stats]) => [name, stats.total] as [string, number]);
  }, [data]);

  // Preparar dados das personas
  const personaData = React.useMemo(() => {
    if (!data?.kommo?.analytics?.personaStats) return [];

    return Object.entries(data.kommo.analytics.personaStats)
      .map(([name, stats]) => [name, stats.count] as [string, number]);
  }, [data]);

  // Calcular total de vendas
  const totalSales = React.useMemo(() => {
    return data?.kommo?.analytics?.purchaseStats?.reduce(
      (sum, purchase) => sum + (purchase.total || 0),
      0
    ) || 0;
  }, [data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Vendas</h1>
          <p className="text-gray-500">Métricas de vendas e desempenho em tempo real</p>
        </div>
        <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Status da Integração
            </h3>
            <p className="mt-1 text-sm text-yellow-700">{error}</p>
          </div>
          <button
            onClick={refresh}
            className="ml-3 bg-yellow-100 p-2 rounded-full text-yellow-600 hover:bg-yellow-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value.toString()}
              change={`${((stat.value - (stat.previousValue || 0)) / (stat.previousValue || 1) * 100).toFixed(1)}%`}
              icon={stat.icon}
            />
          ))
        )}
      </div>

      {!loading && data?.kommo?.analytics && (
        <>
          {/* Daily Leads Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tendência de Leads</h2>
            <DailyLeadsChart 
              data={chartData}
              period={selectedPeriod}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Performance */}
            <VendorStats data={vendorData} />

            {/* Persona Distribution */}
            <PersonaStats data={personaData} />
          </div>

          {/* Purchase Analytics */}
          <PurchaseStats
            total={totalSales}
            byProduct={[]}
            byPayment={[]}
            byPersona={personaData.map(([name, count]) => [
              name,
              { count, value: 0 }
            ])}
          />
        </>
      )}
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