import React from 'react';
import axios from 'axios';

const SyncButton: React.FC = () => {
  const handleSync = async () => {
    try {
      const response = await axios.get('/api/test-sync');
      alert(response.data.message);
    } catch (error) {
      alert('Erro ao testar a conexão. Verifique os logs do backend.');
    }
  };

  return (
    <button onClick={handleSync} className="bg-blue-500 text-white px-4 py-2 rounded">
      Testar Conexão
    </button>
  );
};

export default SyncButton;
