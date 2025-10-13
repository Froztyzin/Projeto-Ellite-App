import axios from 'axios';

const apiClient = axios.create({
  // The baseURL has been removed to prevent `new URL()` construction errors
  // in sandboxed environments where the document's origin might be invalid.
  // All API call paths are now absolute (e.g., '/api/members').
  withCredentials: true, // Permite que cookies sejam enviados com as requisições
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para lidar com erros 401 (Não Autorizado) globalmente
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Se o usuário não estiver autorizado, redireciona para a tela de login.
      // Changing the hash is a gentler way to redirect in a SPA than a full page load.
      // It triggers the router without clearing all application state immediately.
      if (window.location.hash !== '#/login') {
          window.location.hash = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;