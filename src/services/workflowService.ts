export async function startWorkflow() {
    const response = await fetch('/api/sync/workflow/start', {
      method: 'POST',
    });
  
    if (!response.ok) {
      throw new Error('Failed to start workflow');
    }
  
    return await response.json();
  }

export async function fetchWorkflows() {
  const response = await fetch('/api/sync/workflows', {
    method: 'GET',
    cache: 'no-cache', // Evita usar o cache do navegador
  });

  if (response.status === 304) {
    // Opcional: Retornar um cache local ou um estado vazio
    console.warn('Nenhuma modificação detectada, usando cache local.');
    return []; // Ou retorne um estado previamente armazenado
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch workflows: ${response.status}`);
  }

  return await response.json();
}
  
  