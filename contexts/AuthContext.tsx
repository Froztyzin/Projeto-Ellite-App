import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuário administrador mockado para o modo de desenvolvimento.
const mockAdminUser: User = {
  id: 'mock-admin-id-12345',
  nome: 'Admin (Modo Dev)',
  email: 'dev@elitte.com',
  role: Role.ADMIN,
  ativo: true,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Define o usuário mockado por padrão, contornando a tela de login.
  const [user, setUser] = useState<User | null>(mockAdminUser);
  // Define o carregamento como falso, pois não estamos buscando uma sessão.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função de login mockada - não faz nada.
  const login = useCallback(async (email: string, password: string) => {
    console.log('A função de login está desativada no modo de desenvolvimento.');
    return Promise.resolve();
  }, []);

  // Função de logout mockada - não faz nada para evitar o logout.
  const logout = useCallback(() => {
    console.log('A função de logout está desativada no modo de desenvolvimento.');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
