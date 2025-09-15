import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { login as apiLogin, getProfile } from '../services/api/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start as true to check initial session
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const profile = await getProfile(session.user.id);
            if(profile) {
              setUser({
                  id: session.user.id,
                  email: session.user.email!,
                  nome: profile.nome,
                  role: profile.role,
                  ativo: profile.ativo
              });
            }
        }
        setLoading(false);
    };
    
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
             const profile = await getProfile(session.user.id);
             if(profile) {
                setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    nome: profile.nome,
                    role: profile.role,
                    ativo: profile.ativo,
                });
             }
        } else {
            setUser(null);
        }
    });

    return () => subscription.unsubscribe();
}, []);


  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await apiLogin(email, password);
      if (userData) {
        setUser(userData); // The onAuthStateChange listener will also set this, but we do it here for immediate feedback
        if (userData.role === Role.ALUNO) {
            navigate('/portal/dashboard');
        } else {
            navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      throw err; // Re-throw para que o componente de login possa lidar com isso
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login');
  };

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