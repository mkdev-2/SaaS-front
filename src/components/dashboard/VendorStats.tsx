import React from 'react';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';

interface VendorData {
  name: string;
  leads: number;
  active: number;
  value: string;
  rate: string;
}

interface VendorStatsProps {
  data: VendorData[];
}

export default function VendorStats({ data }: VendorStatsProps) {
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => b.leads - a.leads);
  }, [data]);

  const totalLeads = React.useMemo(() => {
    return data.reduce((sum, vendor) => sum + vendor.leads, 0);
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Desempenho dos Vendedores</h2>
          <p className="text-sm text-gray-500">{totalLeads} leads no total</p>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      <div className="space-y-4">
        {sortedData.map((vendor) => {
          const isHighPerformer = parseFloat(vendor.rate.replace('%', '')) > 50;

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
                  <span>{vendor.leads} leads</span>
                  <span className="mx-2">•</span>
                  <span>{vendor.active} ativos</span>
                  <span className="mx-2">•</span>
                  <span>{vendor.value}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  isHighPerformer ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {vendor.rate}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}