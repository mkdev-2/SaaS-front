import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';

export default function KommoConnectionStatus() {
  const [kommoStatus, setKommoStatus] = useState({
    isConnected: false,
    config: null,
    error: null,
  });

  useEffect(() => {
    api.get('/api/kommo/status')
      .then(response => {
        const { accountDomain, connectedAt, isConnected } = response.data;
        setKommoStatus({
          isConnected,
          config: { accountDomain, connectedAt },
          error: null,
        });
      })
      .catch(err => {
        console.error('Erro ao buscar status do Kommo:', err);
        setKommoStatus({
          isConnected: false,
          config: null,
          error: 'Unable to load connection status.',
        });
      });
  }, []);

  return (
    <div>
      <h1>Kommo Integration</h1>
      <p>Status: {kommoStatus.isConnected ? 'Connected' : 'Reconnection Required'}</p>
      <p>Account: {kommoStatus.config?.accountDomain || 'No Account'}</p>
      <p>Last Connected: {kommoStatus.config?.connectedAt || 'Never'}</p>
    </div>
  );
}
