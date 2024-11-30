import React from 'react';
import KommoIntegration from './kommo/KommoIntegration';
import IntegrationCard from './IntegrationCard';
import SyncButton from '../components/SyncButton';
import axios from 'axios';

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
  const handleSync = async () => {
    try {
      // Backend URL
      const backendUrl = "https://saas-backend-production-8b94.up.railway.app";

      // Verifica se o token está disponível
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        alert('Token de autenticação não encontrado.');
        return;
      }

      // Checa o status da integração Kommo
      const statusResponse = await axios.get(`${backendUrl}/api/kommo/status`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Atualiza o token caso receba um novo
      const newToken = statusResponse.headers['x-new-token'];
      if (newToken) {
        localStorage.setItem('accessToken', newToken);
      }

      // Realiza a sincronização
      const syncResponse = await axios.get(`${backendUrl}/api/kommo/sync-products`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      alert(syncResponse.data.message || 'Sincronização concluída com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar:', error.response?.data || error.message);
      alert('Erro ao sincronizar produtos.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-500">Connect your favorite tools and services</p>
        </div>
        <button
          onClick={handleSync}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Sincronizar Produtos
        </button>
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