import React from 'react';
import axios from 'axios';

const SyncButton: React.FC = () => {
    const handleSync = async () => {
        try {
            const response = await api.post('/sync-products');
            console.log('Produtos sincronizados:', response.data);
            return response.data;
          } catch (error) {
            console.error('Erro ao sincronizar produtos:', error);
            throw error;
          }
        };          
      // No frontend

  return (
    <button onClick={handleSync} className="bg-blue-500 text-white px-4 py-2 rounded">
      Testar Conexão
    </button>
  );
};

export default SyncButton;
