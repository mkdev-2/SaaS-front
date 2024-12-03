import React, { useEffect, useState } from 'react';
import WorkflowCard from './WorkflowCard';
import { fetchWorkflows } from '../../services/workflowService';
import { io } from 'socket.io-client';

type Workflow = {
  name: string;
  description: string;
  status: 'active' | 'paused';
  lastRun: string;
  nextRun: string;
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowUpdates, setWorkflowUpdates] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const data = await fetchWorkflows();
        setWorkflows(data);
      } catch (error: any) {
        console.error('Erro ao carregar workflows:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();

    const socket = io('wss://saas-backend-production-8b94.up.railway.app', {
      transports: ['websocket'], // Força o uso do protocolo WebSocket
      reconnectionAttempts: 3, // Tenta reconectar 3 vezes em caso de falha
      timeout: 20000, // Tempo limite para conexão
    });
    
    socket.on('workflowUpdate', (update) => {
      console.log('Atualização do workflow:', update);
      setWorkflowUpdates(update.message);
    });

    return () => {
      socket.off('workflowUpdate');
    };
  }, []);

  const startWorkflow = async (workflowName: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/sync/workflows/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowName }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao iniciar workflow.');
      }

      const data = await response.json();
      console.log(`Workflow ${workflowName} iniciado com sucesso:`, data);
      alert(`Workflow ${workflowName} iniciado com sucesso!`);
    } catch (error) {
      console.error(`Erro ao iniciar workflow ${workflowName}:`, error);
      alert(`Erro ao iniciar workflow ${workflowName}.`);
    }
  };

  if (error) {
    return <p className="text-red-500">Erro: {error}</p>;
  }

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Workflows</h1>
      {workflowUpdates && (
        <div className="bg-blue-100 text-blue-700 p-4 rounded-md">{workflowUpdates}</div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflows.map((workflow, index) => (
          <WorkflowCard
            key={index}
            name={workflow.name}
            description={workflow.description}
            status={workflow.status}
            lastRun={workflow.lastRun}
            nextRun={workflow.nextRun}
            onToggleStatus={() => startWorkflow(workflow.name)} // Conecta ao handler
            onEdit={() => alert(`Editando workflow: ${workflow.name}`)}
            onViewLogs={() => alert(`Visualizando logs de: ${workflow.name}`)}
          />
        ))}
      </div>
    </div>
  );
}
