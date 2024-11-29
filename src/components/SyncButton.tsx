import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux'; // Supondo que Redux seja usado para gerenciar o estado global

const SyncButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Obtenha o token do estado global (ajuste conforme necessário)
  const token = useSelector((state: any) => state.token);

  const handleSync = async () => {
    setLoading(true);
    setMessage(null);

    try {
      if (!token) {
        throw new Error('Token de autenticação não encontrado.');
      }

      const response = await axios.post(
        'https://saas-backend-production-8b94.up.railway.app/api/sync-products',
        {}, // Corpo vazio para este exemplo
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message || 'Sincronização concluída com sucesso!');
    } catch (error) {
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
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default SyncButton;
