import React, { useState, Suspense } from 'react';
import { Users, Box, RefreshCw, AlertCircle, FileText, CheckCircle, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardData } from '../types/dashboard';
import StatCard from './dashboard/StatCard';
import LeadsList from './dashboard/LeadsList';

const DailyLeadsChart = React.lazy(() => import('./dashboard/DailyLeadsChart'));
const VendorStats = React.lazy(() => import('./dashboard/VendorStats'));
const PersonaStats = React.lazy(() => import('./dashboard/PersonaStats'));
const PeriodSelector = React.lazy(() => import('./dashboard/PeriodSelector'));
const PurchaseStats = React.lazy(() => import('./dashboard/PurchaseStats'));
const ConversionFunnelChart = React.lazy(() => import('./dashboard/ConversionFunnelChart'));
const LeadSourceChart = React.lazy(() => import('./dashboard/LeadSourceChart'));
const MetricsGrid = React.lazy(() => import('./dashboard/MetricsGrid'));
const PerformanceTable = React.lazy(() => import('./dashboard/PerformanceTable'));

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
  const today = new Date().toISOString().split('T')[0];
  const dailyStats = analytics.dailyStats?.[today] || {
    total: 0,
    novosLeads: 0,
    interacoes: 0,
    propostas: 0,
    vendas: 0,
    valorVendas: 'R$ 0,00',
    taxaInteracao: '0%',
    taxaVendas: '0%',
    taxaPropostas: '0%'
  };

  // Get period-specific stats
  const currentPeriodStats = periodStats[selectedPeriod === 'today' ? 'day' : selectedPeriod === 'week' ? 'week' : 'fortnight'];

  // Calculate overall metrics (not period-dependent)
  const allTimeStats = {
    totalLeads: Object.values(analytics.dailyStats || {}).reduce((sum, day) => sum + day.total, 0),
    totalVendas: Object.values(analytics.dailyStats || {}).reduce((sum, day) => sum + day.vendas, 0),
    totalValor: Object.values(analytics.dailyStats || {}).reduce((sum, day) => sum + parseFloat(day.valorVendas.replace('R$ ', '').replace('.', '').replace(',', '.')), 0),
  };

  const ticketMedio = allTimeStats.totalVendas > 0 
    ? (allTimeStats.totalValor / allTimeStats.totalVendas)
    : 0;

  return [
    {
      title: "Total de Leads",
      value: currentPeriodStats.totalLeads,
      subtitle: `${dailyStats.novosLeads} novos hoje`,
      icon: Users,
      color: 'indigo'
    },
    {
      title: "Interações",
      value: dailyStats.interacoes,
      subtitle: `Taxa: ${dailyStats.taxaInteracao}`,
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: "Propostas",
      value: dailyStats.propostas,
      subtitle: `Taxa: ${dailyStats.taxaPropostas}`,
      icon: FileText,
      color: 'amber'
    },
    {
      title: "Vendas",
      value: currentPeriodStats.vendas,
      subtitle: `${currentPeriodStats.valorVendas} • ${currentPeriodStats.taxaConversao}`,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: "Ticket Médio",
      value: `R$ ${ticketMedio.toFixed(2)}`,
      subtitle: "Média histórica",
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: "Tempo Médio",
      value: "3.2 dias",
      subtitle: "Da captação à venda",
      icon: Calendar,
      color: 'purple'
    }
  ];
}

function processVendorStats(data: any) {
  if (!data?.vendorStats) return [];
  
  return Object.entries(data.vendorStats).map(([name, stats]: [string, any]) => ({
    name,
    atendimentos: stats.totalAtendimentos,
    propostas: stats.propostas,
    vendas: stats.vendas,
    valor: stats.valorVendas,
    taxaConversao: stats.taxaConversao,
    taxaPropostas: stats.taxaPropostas
  }));
}

function processPersonaStats(data: any) {
  if (!data?.personaStats) return [];
  
  return Object.entries(data.personaStats).map(([name, stats]: [string, any]) => ({
    name,
    quantity: stats.quantity,
    value: stats.totalValue,
    percentage: stats.percentage
  }));
}

function processPurchaseStats(data: any) {
  // Process all-time purchase data
  const purchases = data?.purchases || [];
  const total = purchases.reduce((sum: number, p: any) => sum + p.totalAmount, 0);

  const byProduct = new Map();
  const byPayment = new Map();
  const byPersona = new Map();

  purchases.forEach((purchase: any) => {
    // Process by product
    purchase.products.forEach((product: any) => {
      const current = byProduct.get(product.name) || { count: 0, value: 0 };
      byProduct.set(product.name, {
        count: current.count + product.quantity,
        value: current.value + (product.price * product.quantity)
      });
    });

    // Process by payment method
    const payment = byPayment.get(purchase.paymentMethod) || { count: 0, value: 0 };
    byPayment.set(purchase.paymentMethod, {
      count: payment.count + 1,
      value: payment.value + purchase.totalAmount
    });

    // Process by persona
    const persona = byPersona.get(purchase.persona) || { count: 0, value: 0 };
    byPersona.set(purchase.persona, {
      count: persona.count + 1,
      value: persona.value + purchase.totalAmount
    });
  });

  return {
    total,
    byProduct: Array.from(byProduct.entries()),
    byPayment: Array.from(byPayment.entries()),
    byPersona: Array.from(byPersona.entries())
  };
}

export default function Dashboard() {
  const { data, loading, error, refresh } = useDashboardData();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedView, setSelectedView] = useState('overview');

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
  const today = new Date().toISOString().split('T')[0];
  const todayLeads = data.kommoAnalytics.dailyStats?.[today]?.leads || [];
  const purchaseStats = processPurchaseStats(data.kommoAnalytics);
  const vendorStats = processVendorStats(data.kommoAnalytics);
  const personaStats = processPersonaStats(data.kommoAnalytics);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Analítico</h1>
          <p className="text-gray-500">Análise detalhada de vendas e performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <Suspense fallback={null}>
            <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
          </Suspense>
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="form-select rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="overview">Visão Geral</option>
            <option value="sales">Vendas</option>
            <option value="performance">Performance</option>
            <option value="leads">Leads</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<div className="h-96 bg-white rounded-xl shadow-sm animate-pulse" />}>
          <ConversionFunnelChart data={data.kommoAnalytics} period={selectedPeriod} />
        </Suspense>
        <Suspense fallback={<div className="h-96 bg-white rounded-xl shadow-sm animate-pulse" />}>
          <LeadSourceChart data={data.kommoAnalytics} period={selectedPeriod} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.kommoAnalytics.dailyStats && (
          <Suspense fallback={<div className="h-96 bg-white rounded-xl shadow-sm animate-pulse" />}>
            <DailyLeadsChart 
              data={data.kommoAnalytics.dailyStats}
              period={selectedPeriod}
            />
          </Suspense>
        )}
        
        {vendorStats.length > 0 && (
          <Suspense fallback={<div className="h-96 bg-white rounded-xl shadow-sm animate-pulse" />}>
            <VendorStats data={vendorStats} />
          </Suspense>
        )}
      </div>

      <Suspense fallback={<div className="h-96 bg-white rounded-xl shadow-sm animate-pulse" />}>
        <MetricsGrid data={data.kommoAnalytics} period={selectedPeriod} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {personaStats.length > 0 && (
          <Suspense fallback={<div className="h-96 bg-white rounded-xl shadow-sm animate-pulse" />}>
            <PersonaStats data={personaStats} />
          </Suspense>
        )}

        <Suspense fallback={<div className="h-96 bg-white rounded-xl shadow-sm animate-pulse" />}>
          <PurchaseStats
            total={purchaseStats.total}
            byProduct={purchaseStats.byProduct}
            byPayment={purchaseStats.byPayment}
            byPersona={purchaseStats.byPersona}
          />
        </Suspense>
      </div>

      <Suspense fallback={<div className="h-96 bg-white rounded-xl shadow-sm animate-pulse" />}>
        <PerformanceTable data={data.kommoAnalytics} period={selectedPeriod} />
      </Suspense>

      {todayLeads.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads de Hoje</h2>
          <LeadsList leads={todayLeads} />
        </div>
      )}
    </div>
  );
}