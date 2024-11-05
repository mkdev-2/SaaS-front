import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle2, XCircle, Settings } from 'lucide-react';
import api from '../../../lib/api';
import { ApiResponse } from '../../../types/api';
import { KommoConfig, KommoLead } from '../../../lib/kommo';

export default function KommoIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<KommoLead[]>([]);
  const [config, setConfig] = useState<KommoConfig | null>(null);
  const [needsConfiguration, setNeedsConfiguration] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNeedsConfiguration(false);
      
      const { data: response } = await api.get<ApiResponse<KommoConfig>>('/integrations/kommo/config');
      
      if (response.status === 'success' && response.data) {
        setConfig(response.data);
        setIsConnected(!!response.data.access_token);
        if (response.data.access_token) {
          await loadLeads();
        }
      } else {
        setIsConnected(false);
        setConfig(null);
      }
    } catch (err: any) {
      console.error('Error loading Kommo config:', err);
      if (err.response?.status === 404) {
        setNeedsConfiguration(true);
        setError('Integration not configured. Please contact your administrator.');
      } else {
        setError('Failed to load integration configuration');
      }
      setIsConnected(false);
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeads = async () => {
    if (!config?.access_token) return;

    try {
      setError(null);
      const { data: response } = await api.get<ApiResponse<KommoLead[]>>('/integrations/kommo/leads');
      
      if (response.status === 'success' && response.data) {
        setLeads(response.data);
      } else {
        throw new Error(response.message || 'Failed to load leads');
      }
    } catch (err: any) {
      console.error('Error loading leads:', err);
      if (err.response?.status === 404) {
        setError('Leads endpoint not available. Please check your integration setup.');
      } else {
        setError('Failed to load leads');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (needsConfiguration) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Kommo CRM</h3>
              <p className="text-sm text-gray-500">Integration Setup Required</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Configuration Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This integration needs to be configured by an administrator. Please ensure:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>Kommo API credentials are set up</li>
                  <li>OAuth configuration is complete</li>
                  <li>Required permissions are granted</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.open('https://www.kommo.com/developers', '_blank')}
          className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Documentation
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <img
              src="https://www.kommo.com/favicon.ico"
              alt="Kommo"
              className="h-6 w-6"
              onError={(e) => {
                e.currentTarget.src = 'https://www.google.com/s2/favicons?domain=kommo.com&sz=64';
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Kommo CRM</h3>
            <p className="text-sm text-gray-500">Sync leads and deals with Kommo CRM</p>
          </div>
        </div>
        <div className="flex items-center">
          {isConnected ? (
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle2 className="h-5 w-5 mr-1" />
              Connected
            </span>
          ) : (
            <span className="flex items-center text-sm text-gray-500">
              <XCircle className="h-5 w-5 mr-1" />
              Not Connected
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {isConnected ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <span className="text-sm font-medium text-gray-900">Recent Leads</span>
            <button
              onClick={loadLeads}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-3">
            {leads.length > 0 ? (
              leads.slice(0, 5).map((lead) => (
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
              ))
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                No leads found
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.open('https://www.kommo.com/leads', '_blank')}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View All in Kommo
            </button>

            <button
              onClick={() => {
                setIsConnected(false);
                setConfig(null);
                setLeads([]);
                setError(null);
              }}
              className="w-full py-2 px-4 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-sm transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => window.open('https://www.kommo.com/oauth', '_blank')}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Connect to Kommo
        </button>
      )}
    </div>
  );
}