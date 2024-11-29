import React, { useState } from 'react';
import axios from 'axios';

const SyncButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`https://saas-backend-production-8b94.up.railway.app/api/sync-products`);
      setMessage(response.data.message || 'Sincronização concluída com sucesso!');
    } catch (error) {
      setMessage(
        error.response?.data?.error || 'Erro ao sincronizar produtos. Tente novamente mais tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleSync} disabled={loading}>
        {loading ? 'Sincronizando...' : 'Sincronizar Produtos'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default SyncButton;
