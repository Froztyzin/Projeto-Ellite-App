import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaChartPie, FaSpinner, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalLoading(true);
        setLocalError('');
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err: any) {
            setLocalError(err.message || 'Falha no login. Verifique suas credenciais.');
        } finally {
            setLocalLoading(false);
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
                    <p className="text-slate-400">Bem-vindo! Faça login para continuar.</p>
                </div>

                <div className="bg-card p-8 rounded-lg shadow-lg border border-slate-700">
                    <form onSubmit={handleSubmit}>
                        {localError && (
                            <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center">
                                <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                                <span>{localError}</span>
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
                                autoComplete="email"
                            />
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="text-sm font-medium text-slate-300">Senha</label>
                                <Link to="/forgot-password" className="text-sm text-primary-500 hover:underline focus:outline-none">
                                    Esqueci minha senha
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={passwordVisible ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 pr-10 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Sua senha"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible(!passwordVisible)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-200"
                                    aria-label={passwordVisible ? "Esconder senha" : "Mostrar senha"}
                                >
                                    {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={localLoading}
                            className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition font-semibold disabled:bg-primary-800 disabled:cursor-not-allowed"
                        >
                            {localLoading ? <FaSpinner className="animate-spin" /> : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;