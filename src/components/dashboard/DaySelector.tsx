import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateRange } from '../../types/dashboard';
import { getDefaultDateRange } from '../../utils/dateUtils';

interface DaySelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DaySelector({ value, onChange }: DaySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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
      compareEnd.setHours(23, 59, 59, 999);
      
      const newRange = {
        start,
        end,
        compareStart,
        compareEnd,
        comparison: value.comparison
      };

      onChange(newRange);
      setIsOpen(false); // Close the selector after date change
    }
  };

  const resetToToday = () => {
    const defaultRange = getDefaultDateRange();
    onChange(defaultRange);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span>{formatDate(value.start)}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecione a data
                </label>
                <input
                  type="date"
                  value={value.start.toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={resetToToday}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hoje
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}