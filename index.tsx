import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { supabaseConfigurationError } from './lib/supabaseClient';
import { FaExclamationTriangle } from 'react-icons/fa';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const ConfigurationError: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 text-slate-300">
        <div className="w-full max-w-2xl bg-card p-8 rounded-lg shadow-lg border border-red-500/50">
            <div className="text-center">
                <FaExclamationTriangle className="text-5xl text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-red-300">Erro de Configuração</h1>
                <p className="mt-4 text-slate-300">{message}</p>
                <p className="mt-2 text-sm text-slate-400">
                    A aplicação não pode iniciar. Por favor, verifique se as credenciais do Supabase (<code>SUPABASE_URL</code> e <code>SUPABASE_KEY</code>) estão configuradas como variáveis de ambiente no seu projeto.
                </p>
            </div>
        </div>
    </div>
);


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(rootElement);

if (supabaseConfigurationError) {
    root.render(<ConfigurationError message={supabaseConfigurationError} />);
} else {
    root.render(
      <React.StrictMode>
        <HashRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </AuthProvider>
          </QueryClientProvider>
        </HashRouter>
      </React.StrictMode>
    );
}