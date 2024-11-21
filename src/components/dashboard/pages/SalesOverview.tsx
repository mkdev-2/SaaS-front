import React from 'react';
import { DollarSign, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import StatCard from '../StatCard';
import LeadsList from '../LeadsList';
import DaySelector from '../DaySelector';
import LoadingOverlay from '../../LoadingOverlay';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useDashboardStore } from '../../../store/dashboardStore';
import { DateRange } from '../../../types/dashboard';
import { PIPELINE_STATUS, SALE_STATUSES } from '../../../lib/kommo/constants';
import { formatCurrency } from '../../../utils/leadUtils';

// List of all vendors that should always be included
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

  // Calculate total leads and sales
  const totalLeads = currentStats.leads.length;
  const sales = currentStats.leads.filter(lead => 
    SALE_STATUSES.includes(lead.status_id)
  );

  // Calculate total sales value
  const totalValue = sales.reduce((sum, lead) => {
    const value = typeof lead.valor === 'string' ? 
      parseFloat(lead.valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) :
      lead.valor || 0;
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

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
      value: formatCurrency(totalValue),
      change: getComparisonValue(totalValue, comparisonStats?.valorTotal),
      icon: DollarSign,
      color: "green",
      subtitle: `${sales.length} vendas realizadas`
    },
    {
      title: "Ticket Médio",
      value: sales.length > 0 ? formatCurrency(totalValue / sales.length) : "R$ 0,00",
      change: getComparisonValue(
        sales.length > 0 ? totalValue / sales.length : 0,
        comparisonStats?.ticketMedio
      ),
      icon: ShoppingBag,
      color: "blue",
      subtitle: "Por venda"
    },
    {
      title: "Taxa de Conversão",
      value: totalLeads > 0 ? `${((sales.length / totalLeads) * 100).toFixed(1)}%` : "0%",
      change: getComparisonValue(
        totalLeads > 0 ? (sales.length / totalLeads) * 100 : 0,
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
      subtitle: `${currentStats.leads.filter(l => l.vendedor === 'Não atribuído').length} não atribuídos`
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
        <LeadsList leads={currentStats.leads.map(lead => ({
          id: lead.id,
          nome: lead.nome,
          status: lead.status,
          status_id: lead.status_id,
          statusCor: lead.statusCor,
          tipo: 'novo',
          vendedor: lead.vendedor || 'Não atribuído',
          valor: lead.valor,
          created_at: lead.created_at
        }))} />
      </div>
    </div>
  );
}