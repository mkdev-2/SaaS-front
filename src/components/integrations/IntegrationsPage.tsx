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
      const backendUrl = process.env.REACT_APP_BACKEND_URL; // URL do backend
      const token = localStorage.getItem('accessToken'); // Recupera o token

      if (!token) {
        alert('Token de autenticação não encontrado.');
        return;
      }

      const response = await axios.post(`${backendUrl}/api/sync-products`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert(response.data.message || 'Sincronização concluída com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar:', error.response?.data || error.message);
      alert('Erro ao sincronizar produtos.');
    }
  };

  return (
    <div>
      <button onClick={handleSync} className="bg-blue-500 text-white px-4 py-2 rounded">
        Sincronizar Produtos
      </button>
    </div>
  );
}
