import React, { useState } from 'react';
import { FaChartPie, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('admin@academia.com');
    const [password, setPassword] = useState('admin123');
    const { login, loading, error } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (err) {
            // Error is already handled in AuthContext, but this catch block prevents unhandled promise rejection.
            // Log the specific error for better debugging as requested.
            console.error("Login failed on component level:", err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <FaChartPie className="text-5xl text-primary-500" />
                        <h1 className="ml-4 text-3xl font-bold text-white">Elitte Corpus</h1>
                    </div>
                    <p className="text-slate-400">Bem-vindo de volta! Faça login para continuar.</p>
                </div>

                <div className="bg-card p-8 rounded-lg shadow-lg border border-slate-700">
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center">
                                <FaExclamationTriangle className="mr-2" />
                                {error}
                            </div>
                        )}
                        <div className="mb-4">
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-slate-300">Email</label>
                            <input 
                                type="email" 
                                id="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-slate-300">Senha</label>
                            <input 
                                type="password" 
                                id="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition font-semibold disabled:bg-primary-800 disabled:cursor-not-allowed"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : 'Entrar'}
                        </button>
                    </form>
                     <div className="mt-6 text-center text-xs text-slate-500 space-y-2">
                        <p><strong>Área do Aluno:</strong> Use seu email de cadastro e a senha fornecida pela academia.</p>
                        <p><strong>Teste (Admin):</strong> Use `admin@academia.com` e `admin123`.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;