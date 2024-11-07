import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Users, Tags, ShoppingBag, RefreshCw, AlertCircle } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import DailyLeadsChart from './dashboard/DailyLeadsChart';
import VendorStats from './dashboard/VendorStats';
import PersonaStats from './dashboard/PersonaStats';
import PurchaseStats from './dashboard/PurchaseStats';
import PeriodSelector from './dashboard/PeriodSelector';

// Componente de esqueleto para usar enquanto os dados estão carregando
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export default function Dashboard() {
  const { data, loading, error, refresh } = useDashboardData();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [loadedSections, setLoadedSections] = useState({
    stats: false,
    chart: false,
    vendors: false,
    personas: false,
    purchases: false,
  });

  // Simular carregamento progressivo
  useEffect(() => {
    if (data) {
      const loadSequence = [
        { key: 'stats', delay: 500 },
        { key: 'chart', delay: 100 },
        { key: 'vendors', delay: 150 },
        { key: 'personas', delay: 200 },
        { key: 'purchases', delay: 250 },
      ];

      loadSequence.forEach(({ key, delay }) => {
        setTimeout(() => {
          setLoadedSections(prev => ({ ...prev, [key]: true }));
        }, delay);
      });
    }
  }, [data]);

  // Extrair dados do período selecionado
  const periodStats = React.useMemo(() => {
    if (!data?.kommo?.analytics?.periodStats) {
      return {
        totalLeads: ,
        purchases: ,
        byVendor: {},
        byPersona: {}
      };
    }

    const periodKey = selectedPeriod === 'today' ? 'day' : 
                     selectedPeriod === 'week' ? 'week' : 
                     'fortnight';

    return data.kommo.analytics.periodStats[periodKey] || {
      totalLeads: ,
      purchases: ,
      byVendor: {},
      byPersona: {}
    };
  }, [data, selectedPeriod]);

  // Calcular estatísticas
  const stats = React.useMemo(() => [
    {
      title: "Leads do Período",
      value: periodStats?.totalLeads || ,
      previousValue: ,
      icon: Users
    },
    {
      title: "Vendas Realizadas",
      value: periodStats?.purchases || ,
      previousValue: ,
      icon: ShoppingBag
    },
    {
      title: "Vendedores Ativos",
      value: Object.keys(data?.kommo?.analytics?.vendorStats || {}).length,
      previousValue: ,
      icon: Users
    },
    {
      title: "Total de Personas",
      value: Object.keys(data?.kommo?.analytics?.personaStats || {}).length,
      previousValue: ,
      icon: Tags
    }
  ], [data, periodStats]);

  // Preparar dados do gráfico
  const chartData = React.useMemo(() => {
    if (!data?.kommo?.analytics?.dailyStats) return [];

    return Object.entries(data.kommo.analytics.dailyStats)
      .map(([date, stats]) => ({
        date,
        leads: stats.total,
        value: stats.leads.reduce((sum, lead: any) => sum + (lead.price || ), )
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
      (sum, purchase) => sum + (purchase.total || ),
      
    ) || ;
  }, [data]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Carregando dados
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Aguarde enquanto carregamos as métricas do dashboard...
              </p>
            </div>
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
            <AlertCircle className="h-5 w-5 text-red-400 mt-.5 mr-3" />
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

  if (!data?.kommo?.analytics) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-.5 mr-3" />
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Vendas</h1>
          <p className="text-gray-500">Métricas de vendas e desempenho em tempo real</p>
        </div>
        <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadedSections.stats
          ? stats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value.toString()}
                change={`${((stat.value - (stat.previousValue || )) / (stat.previousValue || 1) * 100).toFixed(1)}%`}
                icon={stat.icon}
              />
            ))
          : Array(4).fill().map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))
        }
      </div>

      {/* Daily Leads Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900">Tendência de Leads</h2>
        {loadedSections.chart
          ? <DailyLeadsChart data={chartData} period={selectedPeriod} />
          : <Skeleton className="h-64" />
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Performance */}
        {loadedSections.vendors
          ? <VendorStats data={vendorData} />
          : <Skeleton className="h-64" />
        }

        {/* Persona Distribution */}
        {loadedSections.personas
          ? <PersonaStats data={personaData} />
          : <Skeleton className="h-64" />
        }
      </div>

      {/* Purchase Analytics */}
      {loadedSections.purchases
        ? <PurchaseStats
            total={totalSales}
            byProduct={[]}
            byPayment={[]}
            byPersona={personaData.map(([name, count]) => [
              name,
              { count, value:  }
            ])}
          />
        : <Skeleton className="h-64" />
      }
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
