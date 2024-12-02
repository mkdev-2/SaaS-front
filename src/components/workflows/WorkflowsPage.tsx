import React, { useEffect, useState } from 'react';
import WorkflowCard from './WorkflowCard';
import { fetchWorkflows } from '../../services/workflowService';

// Definição do tipo para os dados de workflows
type Workflow = {
  name: string;
  description: string;
  status: 'active' | 'paused';
  lastRun: string; // Deve ser uma string, de preferência no formato ISO 8601
  nextRun: string; // Deve ser uma string, ou "Paused"
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validar os dados recebidos
  const validateWorkflows = (data: any[]): data is Workflow[] => {
    return data.every(
      (item) =>
        typeof item.name === 'string' &&
        typeof item.description === 'string' &&
        ['active', 'paused'].includes(item.status) &&
        typeof item.lastRun === 'string' &&
        typeof item.nextRun === 'string'
    );
  };

  // Carregar os workflows ao montar o componente
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const data = await fetchWorkflows(); // Busca os workflows da API

        if (!validateWorkflows(data)) {
          throw new Error('Os dados recebidos não estão no formato esperado.');
        }

        setWorkflows(data);
      } catch (error: any) {
        console.error('Erro ao carregar workflows:', error.message);
        setError(error.message);
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    };

    loadWorkflows();
  }, []);

  // Exibir mensagem de erro, se houver
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
        <p className="text-red-500">Erro ao carregar workflows: {error}</p>
      </div>
    );
  }

  // Exibir carregamento enquanto os workflows não estão disponíveis
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
        <p className="text-gray-500">Loading workflows...</p>
      </div>
    );
  }

  // Renderizar workflows
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-500">Manage your automated workflows</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflows.map((workflow, index) => (
          <WorkflowCard
            key={index}
            name={workflow.name}
            description={workflow.description}
            status={workflow.status}
            lastRun={workflow.lastRun || 'N/A'}
            nextRun={workflow.nextRun || 'N/A'}
          />
        ))}
      </div>
    </div>
  );
}
