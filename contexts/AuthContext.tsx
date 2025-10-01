import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { checkSession, login as apiLogin, loginStudent as apiLoginStudent, logout as apiLogout } from '../services/api/auth';
import apiClient from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  loginStudent: (cpf: string) => Promise<User>;
  logout: () => void;
  loading: boolean; // For initial session check
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const currentUser = await checkSession();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const loggedInUser = await apiLogin(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Falha no login.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const loginStudent = useCallback(async (cpf: string) => {
    setError(null);
    try {
      const loggedInUser = await apiLoginStudent(cpf);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Falha no login.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      // Clear all react-query cache on logout
      // This is not available in the provided import map, so commenting out
      // queryClient.clear(); 
      window.location.hash = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginStudent, logout, loading, error }}>
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
