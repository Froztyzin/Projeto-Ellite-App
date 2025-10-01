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
      // Isso força uma recarga completa da página, limpando todo o estado da aplicação.
      // O `window.location.assign` é usado em vez do `navigate` do React Router
      // porque estamos fora do contexto do React.
      if (window.location.hash !== '#/login') {
          window.location.assign('/#/login');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
