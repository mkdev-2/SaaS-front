import React from 'react';
import { Calendar } from 'lucide-react';

interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <Calendar className="h-5 w-5 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-select rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
      >
        <option value="today">Hoje</option>
        <option value="week">Últimos 7 dias</option>
        <option value="fortnight">Últimos 14 dias</option>
      </select>
    </div>
  );
}