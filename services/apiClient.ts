import axios from 'axios';

const apiClient = axios.create({
  // Using '/api' as the base URL makes it more specific and less prone to
  // resolution issues in sandboxed environments compared to just '/'.
  // This works with the Vite proxy which listens for requests to '/api'.
  baseURL: '/api',
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