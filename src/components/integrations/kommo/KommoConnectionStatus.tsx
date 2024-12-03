
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import socket from '../../../utils/websocket';
import { KommoConfig } from '../../../lib/kommo/types';
import axios from 'axios';

interface KommoConnectionStatusProps {
  isConnected: boolean;
  config: KommoConfig | null;
  error: string | null;
}

export default function KommoConnectionStatus() {
  const [kommoStatus, setKommoStatus] = useState({
    isConnected: false,
    config: null,
    error: null,
  });

  useEffect(() => {
    // Busca inicial da configuração do Kommo no back-end
    axios.get('/api/kommo/status')
      .then(response => {
        const { accountDomain, connectedAt, isConnected } = response.data;
        setKommoStatus({
          isConnected,
          config: { accountDomain, connectedAt },
          error: null,
        });
      })
      .catch(err => {
        console.error('Erro ao buscar configuração inicial do Kommo:', err);
        setKommoStatus({
          isConnected: false,
          config: null,
          error: 'Unable to load connection status.',
        });
      });
  }, []);

  useEffect(() => {
    // Atualizações em tempo real via WebSocket
    socket.on('kommo:connected', (data) => {
      console.log('Evento kommo:connected recebido:', data);
      setKommoStatus({
        isConnected: true,
        config: { ...kommoStatus.config, accountDomain: data.accountDomain, connectedAt: new Date().toISOString() },
        error: null,
      });
    });

    socket.on('kommo:disconnected', () => {
      console.log('Evento kommo:disconnected recebido');
      setKommoStatus({
        isConnected: false,
        config: kommoStatus.config,
        error: 'Your connection needs to be updated.',
      });
    });

    return () => {
      socket.off('kommo:connected');
      socket.off('kommo:disconnected');
    };
  }, [kommoStatus.config]);

  const getStatusText = () => {
    if (kommoStatus.error) return 'Connection Error';
    if (kommoStatus.isConnected) return 'Connected';
    if (kommoStatus.config) return 'Reconnection Required';
    return 'Not Connected';
  };

  return (
    <div className="mb-4">
      <div className={`flex items-center ${kommoStatus.isConnected ? 'text-green-600' : 'text-red-600'}`}>
        {kommoStatus.isConnected ? <CheckCircle2 className="h-5 w-5 mr-1" /> : <AlertTriangle className="h-5 w-5 mr-1" />}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      {kommoStatus.config && (
        <div className="mt-2 text-xs text-gray-500">
          <p>Account: {kommoStatus.config.accountDomain}</p>
          <p>Last Connected: {kommoStatus.config.connectedAt || 'Never'}</p>
        </div>
      )}
      {kommoStatus.error && (
        <div className="mt-2 p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600">{kommoStatus.error}</p>
        </div>
      )}
    </div>
  );
}