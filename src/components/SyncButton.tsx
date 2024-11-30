import React, { useState } from 'react';
import axios from 'axios';

const SyncButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('accessToken'); // Recupera o token
      console.log('Token encontrado:', token); // Log para verificar o token

      if (!token) {
        alert('Token de autenticação não encontrado.');
        setLoading(false);
        return;
      }

      // Faz a chamada para sincronizar produtos
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/kommo/sync-products`, // Rota correta
        {}, // Corpo vazio (ajuste conforme necessário)
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message || 'Sincronização concluída com sucesso!');
    } catch (error: any) {
      console.error('Erro completo:', error);
      setMessage(
        error.response?.data?.error || 'Erro ao sincronizar produtos. Tente novamente mais tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={loading}
        className={`px-4 py-2 rounded ${
          loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white'
        }`}
      >
        {loading ? 'Sincronizando...' : 'Sincronizar Produtos'}
      </button>
      {message && <p className="mt-2 text-gray-700">{message}</p>}
    </div>
  );
};

export default SyncButton;
