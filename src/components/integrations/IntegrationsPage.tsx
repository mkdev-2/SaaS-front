import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import KommoIntegration from './kommo/KommoIntegration';
import IntegrationCard from './IntegrationCard';
import api from '../../lib/api';
import { ApiResponse } from '../../types/api';
import { KommoConfig } from '../../lib/kommo';

const otherIntegrations = [
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
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidConfig, setHasValidConfig] = useState(false);

  useEffect(() => {
    const checkKommoConfig = async () => {
      try {
        const { data: response } = await api.get<ApiResponse<KommoConfig>>('/integrations/kommo/config');
        
        if (response.status === 'success' && response.data?.access_token) {
          setHasValidConfig(true);
        } else {
          // If no valid config exists, redirect to setup
          navigate('/integrations/kommo/setup');
        }
      } catch (error) {
        console.error('Error checking Kommo config:', error);
        // If error occurs (except 404), redirect to setup
        if ((error as any).response?.status !== 404) {
          navigate('/integrations/kommo/setup');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkKommoConfig();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-500">Connect your favorite tools and services</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hasValidConfig ? (
          <KommoIntegration />
        ) : (
          <IntegrationCard
            name="Kommo CRM"
            description="Connect your Kommo CRM account"
            status="disconnected"
            logo="https://www.google.com/s2/favicons?domain=kommo.com&sz=64"
          />
        )}
        {otherIntegrations.map((integration, index) => (
          <IntegrationCard key={index} {...integration} />
        ))}
      </div>
    </div>
  );
}