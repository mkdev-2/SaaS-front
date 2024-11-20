import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { DateRange } from '../../types/dashboard';
import { getDefaultDateRange } from '../../utils/dateUtils';
import ComparisonDatePicker from './ComparisonDatePicker';
import 'react-day-picker/dist/style.css';

interface DaySelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DaySelector({ value, onChange }: DaySelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showComparison, setShowComparison] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    onChange({
      ...value,
      start,
      end,
    });
  };

  const handleComparisonSelect = (date: Date) => {
    const compareStart = new Date(date);
    compareStart.setHours(0, 0, 0, 0);
    
    const compareEnd = new Date(date);
    compareEnd.setHours(23, 59, 59, 999);

    onChange({
      ...value,
      compareStart,
      compareEnd,
      comparison: true
    });
    setShowComparison(false);
  };

  const resetToToday = () => {
    onChange(getDefaultDateRange());
    setIsOpen(false);
  };

  const toggleComparison = () => {
    if (!value.comparison) {
      setShowComparison(true);
    } else {
      onChange({
        ...value,
        comparison: false
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        <span>
          {format(value.start, 'PP', { locale: ptBR })}
          {value.comparison && (
            <span className="text-gray-500">
              {' '}vs{' '}
              {format(value.compareStart, 'PP', { locale: ptBR })}
            </span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-20"
            onClick={() => {
              setIsOpen(false);
              setShowComparison(false);
            }}
          />
          <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">
                Selecione o período
              </h3>
            </div>

            <div className="flex">
              <div className="border-r border-gray-200">
                <DayPicker
                  mode="single"
                  selected={value.start}
                  onSelect={handleSelect}
                  locale={ptBR}
                  className="p-3"
                  classNames={{
                    months: "flex flex-col space-y-4",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm relative p-0 rounded-md hover:bg-gray-100 focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal",
                    day_selected: "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white",
                    day_today: "bg-gray-100",
                    day_disabled: "text-gray-400",
                    day_hidden: "invisible"
                  }}
                />
              </div>

              {showComparison && (
                <ComparisonDatePicker
                  selectedDate={value.compareStart}
                  onSelect={handleComparisonSelect}
                  maxDate={value.start}
                />
              )}
            </div>

            <div className="p-4 border-t border-gray-200 space-y-4">
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

              <div className="flex space-x-2">
                <button
                  onClick={resetToToday}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hoje
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowComparison(false);
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}