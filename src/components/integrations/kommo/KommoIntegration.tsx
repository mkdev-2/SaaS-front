import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKommoIntegration } from '../../../hooks/useKommoIntegration';
import KommoLeadsList from './KommoLeadsList';
import KommoConnectionStatus from './KommoConnectionStatus';
import KommoButton from './KommoButton';

const KOMMO_CONFIG = {
  accountDomain: 'vendaspersonalprime.kommo.com',
  clientId: '6fc1e2d2-0e1d-4549-8efd-1b0b37d0bbb3',
  redirectUri: 'https://saas-backend-production-8b94.up.railway.app/api/kommo/callback'
};

export default function KommoIntegration() {
  const navigate = useNavigate();
  const {
    isConnected,
    isLoading,
    error,
    leads,
    config,
    initiateOAuth,
    disconnect,
    refresh
  } = useKommoIntegration();

  const [authError, setAuthError] = useState<string | null>(null);

  const handleKommoAuth = async () => {
    try {
      setAuthError(null);

      // Construct OAuth URL
      const params = new URLSearchParams({
        client_id: KOMMO_CONFIG.clientId,
        redirect_uri: KOMMO_CONFIG.redirectUri,
        response_type: 'code',
        state: 'initial_auth'
      });

      // Redirect to Kommo OAuth page
      window.location.href = `https://${KOMMO_CONFIG.accountDomain}/oauth2/authorize?${params.toString()}`;
    } catch (err: any) {
      console.error('OAuth error:', err);
      setAuthError(err.message || 'Failed to initiate authentication');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      navigate('/integrations');
    } catch (err: any) {
      console.error('Disconnect error:', err);
      setAuthError(err.message || 'Failed to disconnect from Kommo');
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <img
              src="https://www.kommo.com/static/img/logo.svg"
              alt="Kommo"
              className="h-6 w-6"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJDMiAxNy41MiA2LjQ4IDIyIDEyIDIyQzE3LjUyIDIyIDIyIDE3LjUyIDIyIDEyQzIyIDYuNDggMTcuNTIgMiAxMiAyWk0xMiAyMEM3LjU5IDIwIDQgMTYuNDEgNCAxMkM0IDcuNTkgNy41OSA0IDEyIDRDMTYuNDEgNCAyMCA3LjU5IDIwIDEyQzIwIDE2LjQxIDE2LjQxIDIwIDEyIDIwWiIgZmlsbD0iY3VycmVudENvbG9yIi8+PHBhdGggZD0iTTEyIDE3QzE0Ljc2MTQgMTcgMTcgMTQuNzYxNCAxNyAxMkMxNyA5LjIzODU4IDE0Ljc2MTQgNyAxMiA3QzkuMjM4NTggNyA3IDkuMjM4NTggNyAxMkM3IDE0Ljc2MTQgOS4yMzg1OCAxNyAxMiAxN1oiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg==';
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Kommo CRM</h3>
            <p className="text-sm text-gray-500">Connect your Kommo CRM account</p>
          </div>
        </div>
      </div>

      <KommoConnectionStatus
        isConnected={isConnected}
        config={config}
        error={authError || error}
      />

      {!isConnected && (
        <KommoButton 
          onClick={handleKommoAuth}
          disabled={isLoading}
          isLoading={isLoading}
        />
      )}

      {isConnected && (
        <button
          onClick={handleDisconnect}
          className="mt-4 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Disconnect
        </button>
      )}

      {isConnected && leads?.length > 0 && (
        <KommoLeadsList leads={leads} onRefresh={refresh} />
      )}
    </div>
  );
}