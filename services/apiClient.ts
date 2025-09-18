// Fix: Add a triple-slash directive to include Vite's client types, which defines `import.meta.env` for TypeScript.
/// <reference types="vite/client" />

import axios from 'axios';

// The API base URL is now configured via an environment variable for production.
// VITE_API_URL will be set in Vercel, pointing to your Render backend URL.
// The fallback '/api' is used for local development with Vite's proxy.
const API_URL = import.meta.env?.VITE_API_URL || '/api';

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