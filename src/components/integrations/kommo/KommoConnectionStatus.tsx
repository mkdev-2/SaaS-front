import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { KommoConfig } from '../../../lib/kommo/types';

interface KommoConnectionStatusProps {
  isConnected: boolean;
  config: KommoConfig | null;
  error: string | null;
}

export default function KommoConnectionStatus({ isConnected, config, error }: KommoConnectionStatusProps) {
  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (isConnected) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = () => {
    if (error) return <XCircle className="h-5 w-5 mr-1" />;
    if (isConnected) return <CheckCircle2 className="h-5 w-5 mr-1" />;
    return <AlertTriangle className="h-5 w-5 mr-1" />;
  };

  const getStatusText = () => {
    if (error) return 'Connection Error';
    if (isConnected) return 'Connected';
    if (config) return 'Reconnection Required';
    return 'Not Connected';
  };

  const getStatusMessage = () => {
    if (error) return error;
    if (!config) return 'Please connect your Kommo account';
    if (!isConnected) return 'Your connection needs to be updated. Please reconnect.';
    return null;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="mb-4">
      <div className={`flex items-center ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      {config && (
        <div className="mt-2 text-xs text-gray-500">
          <p>Account: {config.accountDomain}</p>
          <p>Last Connected: {formatDate(config.connectedAt)}</p>
        </div>
      )}

      {getStatusMessage() && (
        <div className="mt-2 p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600">
            {getStatusMessage()}
          </p>
        </div>
      )}
    </div>
  );
}