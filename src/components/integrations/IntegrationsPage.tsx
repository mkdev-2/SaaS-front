import React from 'react';
import IntegrationCard from './IntegrationCard';

const integrations = [
  {
    name: 'Kommo CRM',
    description: 'Sync leads and deals with Kommo CRM',
    status: 'coming_soon' as const,
    logo: 'https://www.google.com/s2/favicons?domain=kommo.com&sz=64'
  },
  {
    name: 'Power BI',
    description: 'Visualize your data with Power BI dashboards',
    status: 'coming_soon' as const,
    logo: 'https://www.google.com/s2/favicons?domain=powerbi.microsoft.com&sz=64'
  },
  {
    name: 'Tableau',
    description: 'Create interactive data visualizations',
    status: 'coming_soon' as const,
    logo: 'https://www.google.com/s2/favicons?domain=tableau.com&sz=64'
  }
];

export default function IntegrationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-500">Connect your favorite tools and services</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration, index) => (
          <IntegrationCard key={index} {...integration} />
        ))}
      </div>
    </div>
  );
}