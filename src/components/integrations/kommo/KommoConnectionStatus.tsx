
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import socket from '../../../utils/websocket';
import { KommoConfig } from '../../../lib/kommo/types';

interface KommoConnectionStatusProps {
  isConnected: boolean;
  config: KommoConfig | null;
  error: string | null;
}

export default function KommoConnectionStatus({ isConnected, config, error }: KommoConnectionStatusProps) {
  const [kommoStatus, setKommoStatus] = useState({
    isConnected,
    config,
    error,
  });

  useEffect(() => {
    // Update status when connected via WebSocket
    socket.on('kommo:connected', (data) => {
      setKommoStatus({
        isConnected: true,
        config: { ...config, accountDomain: data.accountDomain, connectedAt: new Date().toISOString() },
        error: null,
      });
    });

    // Update status when disconnected
    socket.on('kommo:disconnected', () => {
      setKommoStatus({
        isConnected: false,
        config,
        error: 'Your connection needs to be updated.',
      });
    });

    return () => {
      socket.off('kommo:connected');
      socket.off('kommo:disconnected');
    };
  }, [config]);

  const getStatusColor = () => {
    if (kommoStatus.error) return 'text-red-600';
    if (kommoStatus.isConnected) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = () => {
    if (kommoStatus.error) return <XCircle className="h-5 w-5 mr-1" />;
    if (kommoStatus.isConnected) return <CheckCircle2 className="h-5 w-5 mr-1" />;
    return <AlertTriangle className="h-5 w-5 mr-1" />;
  };

  const getStatusText = () => {
    if (kommoStatus.error) return 'Connection Error';
    if (kommoStatus.isConnected) return 'Connected';
    if (kommoStatus.config) return 'Reconnection Required';
    return 'Not Connected';
  };

  const getStatusMessage = () => {
    if (kommoStatus.error) return kommoStatus.error;
    if (!kommoStatus.config) return 'Please connect your Kommo account';
    if (kommoStatus.config && !kommoStatus.isConnected) return 'Reconnection Required';
    return null;
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString();
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
      
      {kommoStatus.config && (
        <div className="mt-2 text-xs text-gray-500">
          <p>Account: {kommoStatus.config.accountDomain}</p>
          <p>Last Connected: {formatDate(kommoStatus.config.connectedAt)}</p>
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
