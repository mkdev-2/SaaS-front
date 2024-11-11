import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color?: string;
  subtitle?: string;
}

export default function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'indigo',
  subtitle 
}: StatCardProps) {
  const isPositive = change ? !change.startsWith('-') : true;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className={cn(
          "p-2 rounded-lg",
          `bg-${color}-100`
        )}>
          <Icon className={cn(
            "h-5 w-5 sm:h-6 sm:w-6",
            `text-${color}-600`
          )} />
        </div>
        {change && (
          <span className={cn(
            "flex items-center text-xs sm:text-sm",
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {change}
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 ml-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 ml-1" />
            )}
          </span>
        )}
      </div>
      <h3 className="text-lg sm:text-2xl font-bold mt-4">{value}</h3>
      <p className="text-xs sm:text-sm text-gray-600">{title}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}