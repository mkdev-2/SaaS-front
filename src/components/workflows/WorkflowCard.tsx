import React from 'react';
import { Play, Pause, Clock, ArrowRight } from 'lucide-react';

interface WorkflowCardProps {
  name: string;
  description: string;
  status: 'active' | 'paused';
  lastRun: string;
  nextRun: string;
}

export default function WorkflowCard({ name, description, status, lastRun, nextRun }: WorkflowCardProps) {
  // Função para exibir datas ou valores textuais corretamente
  const renderRunValue = (value: string) => {
    if (value === 'Paused') {
      return 'Paused'; // Valor textual
    }
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid Date');
      }
      return date.toLocaleString(); // Formata para string legível
    } catch {
      return 'Invalid Date'; // Fallback para valores inválidos
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <button
          className={`p-2 rounded-full ${
            status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {status === 'active' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-2" />
          Last run: {renderRunValue(lastRun)}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <ArrowRight className="h-4 w-4 mr-2" />
          Next run: {renderRunValue(nextRun)}
        </div>
      </div>

      <div className="mt-4 flex space-x-3">
        <button className="flex-1 py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
          Edit
        </button>
        <button className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
          View Logs
        </button>
      </div>
    </div>
  );
}
