import axios from 'axios';

// The API base URL is now a relative path, as the backend will serve the frontend.
const API_URL = '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors by logging out the user
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      // Use location.assign to force a full page reload to clear all state
      window.location.assign('/#/login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
