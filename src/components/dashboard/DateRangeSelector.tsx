import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateRange } from '../../types/dashboard';
import { getDefaultDateRange } from '../../utils/dateUtils';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  showComparison?: boolean;
}

export default function DateRangeSelector({ value, onChange, showComparison = true }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'start' | 'end' | 'compareStart' | 'compareEnd') => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      if (field === 'start' || field === 'compareStart') {
        newDate.setHours(0, 0, 0, 0);
      } else {
        newDate.setHours(23, 59, 59, 999);
      }
      onChange({
        ...value,
        [field]: newDate
      });
    }
  };

  const toggleComparison = () => {
    onChange({
      ...value,
      comparison: !value.comparison
    });
  };

  const resetToDefault = () => {
    onChange(getDefaultDateRange());
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span>
          {formatDate(value.start)}
          {value.comparison && ` vs ${formatDate(value.compareStart)}`}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data selecionada
              </label>
              <input
                type="date"
                value={value.start.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange(e, 'start')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {showComparison && (
              <>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value.comparison}
                    onChange={toggleComparison}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Comparar com outro período
                  </label>
                </div>

                {value.comparison && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data comparada
                    </label>
                    <input
                      type="date"
                      value={value.compareStart.toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange(e, 'compareStart')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      max={value.start.toISOString().split('T')[0]}
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex space-x-2">
              <button
                onClick={resetToDefault}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hoje
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}