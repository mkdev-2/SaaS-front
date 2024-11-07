import React from 'react';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';

interface VendorStatsProps {
  data: [string, number][];
}

export default function VendorStats({ data }: VendorStatsProps) {
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => b[1] - a[1]);
  }, [data]);

  const totalLeads = React.useMemo(() => {
    return data.reduce((sum, [_, count]) => sum + count, 0);
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Vendor Performance</h2>
          <p className="text-sm text-gray-500">{totalLeads} total leads</p>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      <div className="space-y-4">
        {sortedData.map(([vendor, count]) => {
          const percentage = ((count / totalLeads) * 100).toFixed(1);
          const isHighPerformer = count > (totalLeads / data.length);

          return (
            <div key={vendor} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{vendor}</span>
                  {isHighPerformer ? (
                    <TrendingUp className="h-4 w-4 text-green-500 ml-2" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 ml-2" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{count} leads</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  isHighPerformer ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}