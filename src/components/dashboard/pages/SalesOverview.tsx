import React from 'react';
import { DollarSign, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import StatCard from '../StatCard';
import LeadsList from '../LeadsList';
import DaySelector from '../DaySelector';
import LoadingOverlay from '../../LoadingOverlay';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useDashboardStore } from '../../../store/dashboardStore';
import { DateRange } from '../../../types/dashboard';
import { normalizeStatus } from '../../../utils/leadUtils';

// List of all possible vendors
const ALL_VENDORS = [
  'Ana Paula Honorato',
  'Breno Santana',
  'Karla Bianca',
  'Rodrigo Ferreira',
  'Diuly',
  'Amanda Arouche',
  'Não atribuído'
];

export default function SalesOverview() {
  const { selectedDate, setSelectedDate } = useDashboardStore();
  const { data, loading, error, isConnected } = useDashboardData();

  const handleDateChange = (newDate: DateRange) => {
    setSelectedDate(newDate);
  };

  if (loading || !data?.currentStats) {
    return <LoadingOverlay />;
  }

  const { currentStats, comparisonStats } = data;

  // Ensure all vendors are represented in the stats
  const vendedores = { ...currentStats.vendedores };
  ALL_VENDORS.forEach(vendor => {
    if (!vendedores[vendor]) {
      vendedores[vendor] = {
        name: vendor,
        totalLeads: 0,
        activeLeads: 0,
        proposals: 0,
        sales: 0,
        valorVendas: 'R$ 0,00',
        taxaConversao: '0.0%',
        taxaPropostas: '0.0%',
        valorMedioVenda: 'R$ 0,00',
        valorTotal: 'R$ 0,00',
        rawValues: { revenue: 0, sales: 0 },
        leads: []
      };
    }
  });

  // Include all leads in total count, including unassigned ones
  const totalLeads = currentStats.leads.length;
  const assignedLeads = currentStats.leads.filter(lead => lead.vendedor && lead.vendedor !== 'Não atribuído').length;
  const unassignedLeads = totalLeads - assignedLeads;

  // Calculate total sales value and count
  const salesData = currentStats.leads.reduce((acc, lead) => {
    const status = normalizeStatus(lead.status);
    if (status === 'Venda Realizada' || status === 'Pós-Venda' || status === 'Fechamento') {
      const value = parseFloat(lead.valor.replace('R$ ', '').replace('.', '').replace(',', '.'));
      if (!isNaN(value)) {
        acc.totalValue += value;
        acc.count += 1;
      }
    }
    return acc;
  }, { totalValue: 0, count: 0 });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getComparisonValue = (current: number | string, comparison: number | string | undefined) => {
    if (!comparison || !selectedDate.comparison) return undefined;
    
    const currentValue = typeof current === 'string' ? 
      parseFloat(current.replace(/[^0-9.-]+/g, "")) : 
      current;
    
    const comparisonValue = typeof comparison === 'string' ? 
      parseFloat(comparison.replace(/[^0-9.-]+/g, "")) : 
      comparison;

    const diff = ((currentValue - comparisonValue) / comparisonValue) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const statsConfig = [
    {
      title: "Receita Total",
      value: formatCurrency(salesData.totalValue),
      change: getComparisonValue(salesData.totalValue, comparisonStats?.valorTotal),
      icon: DollarSign,
      color: "green",
      subtitle: `${salesData.count} vendas realizadas`
    },
    {
      title: "Ticket Médio",
      value: salesData.count > 0 ? 
        formatCurrency(salesData.totalValue / salesData.count) : 
        "R$ 0,00",
      change: getComparisonValue(
        salesData.count > 0 ? salesData.totalValue / salesData.count : 0,
        comparisonStats?.ticketMedio
      ),
      icon: ShoppingBag,
      color: "blue",
      subtitle: "Por venda"
    },
    {
      title: "Taxa de Conversão",
      value: totalLeads > 0 ? 
        `${((salesData.count / totalLeads) * 100).toFixed(1)}%` : 
        "0%",
      change: getComparisonValue(
        salesData.count / totalLeads * 100,
        comparisonStats?.taxaConversao
      ),
      icon: TrendingUp,
      color: "indigo",
      subtitle: `De ${totalLeads} leads totais`
    },
    {
      title: "Leads Ativos",
      value: totalLeads,
      change: getComparisonValue(totalLeads, comparisonStats?.totalLeads),
      icon: Users,
      color: "purple",
      subtitle: `${unassignedLeads} não atribuídos`
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Visão Geral de Vendas</h1>
          <p className="text-sm sm:text-base text-gray-500">
            Acompanhamento em tempo real do desempenho comercial
            {!isConnected && ' (Reconectando...)'}
          </p>
        </div>
        <DaySelector value={selectedDate} onChange={handleDateChange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsConfig.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Leads do Período</h2>
        </div>
        <LeadsList leads={currentStats.leads} />
      </div>
    </div>
  );
}