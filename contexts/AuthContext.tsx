import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, Role } from '../types';
import { login as apiLogin, logout as apiLogout } from '../services/api/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  login: (email: string, credential: string, userType: 'student' | 'staff') => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // On initial load, check for a user session and token in localStorage
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('authToken');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      } else {
        // If one is missing, clear both to be safe
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, credential: string, userType: 'student' | 'staff') => {
    setLoading(true);
    setError(null);
    try {
      const { user: loggedInUser, token } = await apiLogin(email, credential, userType);
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      localStorage.setItem('authToken', token);

      // Navigate after setting the user
      if (loggedInUser.role === Role.ALUNO) {
        navigate('/portal/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {!loading && children}
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