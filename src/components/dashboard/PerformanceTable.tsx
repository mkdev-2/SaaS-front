import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface PerformanceTableProps {
  data: any;
  period: string;
}

export default function PerformanceTable({ data, period }: PerformanceTableProps) {
  const performanceData = React.useMemo(() => {
    // Simulate performance data
    return [
      {
        vendedor: 'João Silva',
        leads: 45,
        propostas: 32,
        vendas: 18,
        valor: 'R$ 54.000,00',
        conversao: '40%',
        ticket: 'R$ 3.000,00',
        tendencia: 'up'
      },
      {
        vendedor: 'Maria Santos',
        leads: 38,
        propostas: 25,
        vendas: 15,
        valor: 'R$ 45.000,00',
        conversao: '39%',
        ticket: 'R$ 3.000,00',
        tendencia: 'down'
      },
      {
        vendedor: 'Pedro Costa',
        leads: 42,
        propostas: 28,
        vendas: 16,
        valor: 'R$ 48.000,00',
        conversao: '38%',
        ticket: 'R$ 3.000,00',
        tendencia: 'up'
      }
    ];
  }, [data, period]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Performance da Equipe</h2>
        <p className="text-sm text-gray-500">Análise detalhada por vendedor</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leads
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propostas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Taxa Conv.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket Médio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tendência
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {performanceData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{row.vendedor}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{row.leads}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{row.propostas}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{row.vendas}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{row.valor}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{row.conversao}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{row.ticket}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {row.tendencia === 'up' ? (
                    <ArrowUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDown className="h-5 w-5 text-red-500" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}