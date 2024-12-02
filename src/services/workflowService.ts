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
  const response = await fetch('/api/sync/workflows');
  if (!response.ok) {
    throw new Error('Failed to fetch workflows');
  }
  return await response.json();
}
  