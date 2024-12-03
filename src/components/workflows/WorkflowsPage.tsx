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

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000');

    socket.on('workflowUpdate', (update) => {
      console.log('Atualização do workflow:', update);
      setWorkflowUpdates(update.message);
    });

    return () => {
      socket.off('workflowUpdate');
    };
  }, []);

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
        <div className="bg-blue-100 text-blue-700 p-4 rounded-md">
          {workflowUpdates}
        </div>
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
          onToggleStatus={() =>
            alert(
              `${workflow.status === 'active' ? 'Pausing' : 'Starting'} workflow: ${workflow.name}`
            )
          }
          onEdit={() => alert(`Editing workflow: ${workflow.name}`)}
          onViewLogs={() => alert(`Viewing logs for workflow: ${workflow.name}`)}
        />
      ))}
    </div>

    </div>
  );
}