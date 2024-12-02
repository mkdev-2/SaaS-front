import React, { useEffect, useState } from 'react';
import WorkflowCard from './WorkflowCard';
import { fetchWorkflows } from '../../services/workflowService';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar os workflows ao montar o componente
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const data = await fetchWorkflows(); // Busca os workflows da API
        setWorkflows(data);
      } catch (error) {
        console.error('Erro ao carregar workflows:', error.message);
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    };

    loadWorkflows();
  }, []);

  // Exibir carregamento enquanto os workflows não estão disponíveis
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
        <p className="text-gray-500">Loading workflows...</p>
      </div>
    );
  }

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
          <WorkflowCard key={index} {...workflow} />
        ))}
      </div>
    </div>
  );
}
