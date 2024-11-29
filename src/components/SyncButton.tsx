import React from 'react';
import axios from 'axios';

const SyncButton: React.FC = () => {
    const handleSync = async () => {
        try {
            const response = await axios.post('/api/sync-products');
            console.log('Resposta:', response.data);
          } catch (error) {
            console.error('Erro completo:', error);
            console.error('Resposta do erro:', error.response?.data);
          }
          
          console.log(response.data);
          
      };
            
      // No frontend

  return (
    <button onClick={handleSync} className="bg-blue-500 text-white px-4 py-2 rounded">
      Testar Conexão
    </button>
  );
};

export default SyncButton;
