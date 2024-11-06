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
  clientSecret: 'O4QcVGEURJVwaCwXIa9ZAxAgpelDtgBnrWObukW6SBlTjYKkSCNJklmhVH5tpTVh',
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
      
      // Construct OAuth URL directly
      const params = new URLSearchParams({
        client_id: KOMMO_CONFIG.clientId,
        redirect_uri: KOMMO_CONFIG.redirectUri,
        response_type: 'code',
        state: 'test'
      });

      const authUrl = `https://${KOMMO_CONFIG.accountDomain}/oauth2/authorize?${params.toString()}`;

      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'Kommo Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Failed to open authorization window. Please allow popups for this site.');
      }

      // Add message listener for the popup callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'KOMMO_AUTH_CODE') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          
          try {
            // Exchange code for token
            await initiateOAuth({
              ...KOMMO_CONFIG,
              code: event.data.code
            });
            
            await refresh();
            navigate('/integrations');
          } catch (err: any) {
            setAuthError(err.message || 'Failed to complete authentication');
          }
        } else if (event.data?.type === 'KOMMO_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          setAuthError('Authentication failed. Please try again.');
        }
      };

      window.addEventListener('message', handleMessage);
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
              src="https://www.google.com/s2/favicons?domain=kommo.com&sz=64"
              alt="Kommo"
              className="h-6 w-6"
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