import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import kommoAPI, { KommoConfig, KommoLead } from '../../../lib/kommo';

export default function KommoIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<KommoLead[]>([]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/integrations/kommo/config');
      const config: KommoConfig = await response.json();
      
      if (config.access_token) {
        kommoAPI.setConfig(config);
        setIsConnected(true);
        await loadLeads();
      }
    } catch (err) {
      console.error('Error loading Kommo config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const leads = await kommoAPI.getLeads();
      setLeads(leads);
      setError(null);
    } catch (err) {
      setError('Failed to load leads');
    }
  };

  const handleConnect = () => {
    const authUrl = kommoAPI.getAuthUrl();
    const popup = window.open(authUrl, 'Kommo Auth', 'width=600,height=600');
    
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'KOMMO_AUTH_CODE') {
        try {
          await kommoAPI.exchangeCode(event.data.code);
          setIsConnected(true);
          await loadLeads();
        } catch (err) {
          setError('Failed to connect to Kommo');
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Kommo CRM</h3>
          <p className="text-sm text-gray-500">Sync leads and deals with Kommo CRM</p>
        </div>
        {error && (
          <div className="flex items-center text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </div>
        )}
      </div>

      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Connect to Kommo
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <span className="text-sm font-medium text-gray-900">Recent Leads</span>
            <button
              onClick={loadLeads}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-3">
            {leads.slice(0, 5).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{lead.name}</p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(lead.created_at * 1000).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${lead.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.open('https://www.kommo.com/leads', '_blank')}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View All in Kommo
          </button>
        </div>
      )}
    </div>
  );
}