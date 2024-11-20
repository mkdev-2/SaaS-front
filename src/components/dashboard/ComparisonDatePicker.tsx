import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { Calendar as CalendarIcon } from 'lucide-react';

interface ComparisonDatePickerProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  maxDate: Date;
}

export default function ComparisonDatePicker({ selectedDate, onSelect, maxDate }: ComparisonDatePickerProps) {
  return (
    <div className="p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          Selecione a data para comparação
        </span>
      </div>
      
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onSelect(date)}
        locale={ptBR}
        disabled={{ after: maxDate }}
        className="border rounded-lg bg-white shadow-sm"
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
  );
}