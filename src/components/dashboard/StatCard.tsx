import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color?: string;
}

export default function StatCard({ title, value, change, icon: Icon, color = 'indigo' }: StatCardProps) {
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