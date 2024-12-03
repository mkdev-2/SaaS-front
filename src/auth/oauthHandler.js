
import axios from 'axios';

export const handleOAuthMessage = () => {
  window.addEventListener('message', (event) => {
    const { type, code, error } = event.data;

    if (type === 'KOMMO_AUTH_CODE') {
      axios.post('/api/kommo/auth/callback', { code })
        .then(response => console.log('OAuth successful:', response.data))
        .catch(err => console.error('OAuth error:', err));
    }

    if (type === 'KOMMO_AUTH_ERROR') {
      console.error('OAuth error:', error);
    }
  });
};
