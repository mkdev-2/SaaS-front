import React, { useEffect, useState } from 'react';
import WorkflowCard from './WorkflowCard';
import { fetchWorkflows } from '../../services/workflowService';
import { io } from 'socket.io-client';

// Definição do tipo para os dados de workflows
type Workflow = {
  name: string;
  description: string;
  status: 'active' | 'paused';
  lastRun: string; // ISO 8601 string
  nextRun: string; // ISO 8601 string ou "Paused"
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState<string | null>(null);

  // Função para formatar datas
  const formatDate = (dateString: string) => {
    if (dateString === 'Paused') {
      return 'Paused'; // Retorna como está
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid Date');
      }
      return date.toLocaleString(); // Formata para string legível
    } catch {
      return 'Invalid Date'; // Fallback em caso de erro
    }
  };

  // Carregar os workflows ao montar o componente
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const data = await fetchWorkflows(); // Busca os workflows da API
        console.log('Workflows carregados:', data);
        setWorkflows(data);
      } catch (error: any) {
        console.error('Erro ao carregar workflows:', error.message);
        setError(error.message);
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    };

    loadWorkflows();

    // Configurar o WebSocket para monitorar atualizações em tempo real
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000'); // URL do WebSocket

    socket.on('workflowUpdate', (update) => {
      console.log('Atualização do workflow:', update);
      setRealTimeUpdates(update.message); // Atualizar mensagem de status
    });

    return () => {
      socket.off('workflowUpdate'); // Limpa o evento ao desmontar o componente
    };
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

      {realTimeUpdates && (
        <div className="mt-4 p-4 bg-blue-100 text-blue-700 rounded-md">
          {realTimeUpdates}
        </div>
      )}

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
