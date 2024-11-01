import React from 'react';
import WorkflowCard from './WorkflowCard';

const workflows = [
  {
    name: 'CRM Data Sync',
    description: 'Sync contacts and deals between Kommo CRM and local database',
    status: 'active' as const,
    lastRun: '2 hours ago',
    nextRun: 'in 1 hour'
  },
  {
    name: 'BI Report Generation',
    description: 'Generate and export BI reports daily',
    status: 'paused' as const,
    lastRun: '1 day ago',
    nextRun: 'Paused'
  },
  {
    name: 'Lead Scoring',
    description: 'Calculate and update lead scores based on activities',
    status: 'active' as const,
    lastRun: '30 minutes ago',
    nextRun: 'in 30 minutes'
  }
];

export default function WorkflowsPage() {
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