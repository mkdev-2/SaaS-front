import React, { useEffect, useState } from 'react';
import WorkflowCard from './WorkflowCard';
import { fetchWorkflows } from '../../services/workflowService';

// Definição do tipo para os dados de workflows
type Workflow = {
  name: string;
  description: string;
  status: 'active' | 'paused';
  lastRun: string; // Deve ser uma string no formato ISO 8601
  nextRun: string; // Pode ser uma string no formato ISO 8601 ou "Paused"
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para formatar datas
  const formatDate = (dateString: string) => {
    // Se for "Paused", retorne como está
    if (dateString === 'Paused') {
      return 'Paused';
    }

    // Tente criar uma data e formatá-la
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date'; // Fallback para valores inesperados
    }

    return date.toLocaleString(); // Formatar para string legível
  };

  // Carregar os workflows ao montar o componente
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const data = await fetchWorkflows(); // Busca os workflows da API
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
            lastRun={formatDate(workflow.lastRun)}
            nextRun={formatDate(workflow.nextRun)}
          />
        ))}
      </div>
    </div>
  );
}
