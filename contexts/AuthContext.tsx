import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, Role } from '../types';
import { login as apiLogin } from '../services/api/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async (authUser: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('nome, role, ativo')
        .eq('id', authUser.id)
        .single();
      
      if (error) throw new Error("Perfil não encontrado ou erro ao buscar.");
      
      if (profile) {
        const fullUser: User = {
          id: authUser.id,
          email: authUser.email,
          nome: profile.nome,
          role: profile.role,
          ativo: profile.ativo,
        };
        setUser(fullUser);
        localStorage.setItem('user', JSON.stringify(fullUser)); // Cache for faster initial loads
      }
    } catch (e) {
      console.error("Erro ao buscar perfil do usuário, deslogando:", e);
      await supabase.auth.signOut();
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    // On initial load, check for an active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        if(session?.user) {
            await fetchUserProfile(session.user);
        }
        setLoading(false);
    });

    // Listen for authentication state changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            await fetchUserProfile(session.user);
        } else {
            setUser(null);
            localStorage.removeItem('user');
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiLogin(email, password);
      // onAuthStateChange will handle setting the user and navigating
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will handle cleanup
    navigate('/login');
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