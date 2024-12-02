export async function startWorkflow() {
    const response = await fetch('/api/sync/workflow/start', {
      method: 'POST',
    });
  
    if (!response.ok) {
      throw new Error('Failed to start workflow');
    }
  
    return await response.json();
  }
  export const fetchLogs = async () => {
    try {
      const response = await fetch('/api/sync/logs'); // Certifique-se que esta rota está disponível
      if (!response.ok) {
        throw new Error('Erro ao carregar logs');
      }
      const data = await response.json();
      return data.logs;
    } catch (error) {
      console.error('Erro ao buscar logs:', error.message);
      throw error;
    }
  };
  
export async function fetchWorkflows() {
  try {
    const response = await fetch('https://saas-backend-production-8b94.up.railway.app/api/sync/workflows', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Resposta não é JSON');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar workflows:', error.message);
    throw error;
  }
}
  
  