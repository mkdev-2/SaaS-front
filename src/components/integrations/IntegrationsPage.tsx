import React from 'react';
import KommoIntegration from './kommo/KommoIntegration';
import IntegrationCard from './IntegrationCard';

const otherIntegrations = [
  {
    name: 'Power BI',
    description: 'Visualize your data with Power BI dashboards',
    status: 'disconnected' as const,
    logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&h=128&fit=crop'
  },
  {
    name: 'Tableau',
    description: 'Create interactive data visualizations',
    status: 'disconnected' as const,
    logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&h=128&fit=crop'
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
        <KommoIntegration />
        {otherIntegrations.map((integration, index) => (
          <IntegrationCard key={index} {...integration} />
        ))}
      </div>
    </div>
  );
}