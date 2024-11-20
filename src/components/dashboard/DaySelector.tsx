import React from 'react';
import { Calendar } from 'lucide-react';
import { DateRange } from '../../types/dashboard';
import { getDefaultDateRange } from '../../utils/dateUtils';

interface DaySelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DaySelector({ value, onChange }: DaySelectorProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    
    if (!isNaN(selectedDate.getTime())) {
      // Create new range with selected date
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      // Previous day for comparison
      const compareEnd = new Date(start);
      const compareStart = new Date(start);
      compareStart.setDate(compareStart.getDate() - 1);
      compareStart.setHours(0, 0, 0, 0);
      
      onChange({
        start,
        end,
        compareStart,
        compareEnd,
        comparison: value.comparison
      });
    }
  };

  const resetToToday = () => {
    onChange(getDefaultDateRange());
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <input
          type="date"
          value={value.start.toISOString().split('T')[0]}
          onChange={handleDateChange}
          max={new Date().toISOString().split('T')[0]}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      <button
        onClick={resetToToday}
        className="px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        Hoje
      </button>
    </div>
  );
}