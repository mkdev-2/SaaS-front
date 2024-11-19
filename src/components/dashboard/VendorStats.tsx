import React from 'react';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';

interface VendorData {
  name: string;
  atendimentos: number;
  propostas: number;
  vendas: number;
  valor: string;
  taxaConversao: string;
  taxaPropostas: string;
}

interface VendorStatsProps {
  data: VendorData[];
}

export default function VendorStats({ data }: VendorStatsProps) {
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => b.atendimentos - a.atendimentos);
  }, [data]);

  const totalAtendimentos = React.useMemo(() => {
    return data.reduce((sum, vendor) => sum + vendor.atendimentos, 0);
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Desempenho dos Vendedores</h2>
          <p className="text-sm text-gray-500">{totalAtendimentos} atendimentos no total</p>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      <div className="space-y-4">
        {sortedData.map((vendor) => {
          const isHighPerformer = parseFloat(vendor.taxaConversao.replace('%', '')) > 0;

          return (
            <div key={vendor.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{vendor.name}</span>
                  {isHighPerformer ? (
                    <TrendingUp className="h-4 w-4 text-green-500 ml-2" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 ml-2" />
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span>{vendor.atendimentos} atendimentos</span>
                  <span className="mx-2">•</span>
                  <span>{vendor.propostas} propostas</span>
                  <span className="mx-2">•</span>
                  <span>{vendor.vendas} vendas</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span>Valor: {vendor.valor}</span>
                  <span className="mx-2">•</span>
                  <span>Prop: {vendor.taxaPropostas}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  isHighPerformer ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {vendor.taxaConversao}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}