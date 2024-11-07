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
      
      // Save initial configuration
      await initiateOAuth({
        accountDomain: KOMMO_CONFIG.accountDomain,
        clientId: KOMMO_CONFIG.clientId,
        redirectUri: KOMMO_CONFIG.redirectUri
      });

      // Construct OAuth URL
      const params = new URLSearchParams({
        client_id: KOMMO_CONFIG.clientId,
        redirect_uri: KOMMO_CONFIG.redirectUri,
        response_type: 'code',
        mode: 'post_message'
      });

      const authUrl = `https://${KOMMO_CONFIG.accountDomain}/oauth2/authorize?${params.toString()}`;

      // Open popup for OAuth flow
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

      // Handle OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'KOMMO_AUTH_CODE') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          
          try {
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-600">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
              <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="currentColor"/>
            </svg>
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