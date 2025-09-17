import React, { useState } from 'react';
import { FaChartPie, FaSpinner, FaExclamationTriangle, FaEye, FaEyeSlash, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Role } from '../../types';
import { formatCPF } from '../../lib/utils';

type UserType = 'student' | 'staff';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [credential, setCredential] = useState(''); // Can be password or CPF
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [userType, setUserType] = useState<UserType>('student');
    const { login, loading, error, user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, credential, userType);
        } catch (err) {
            console.error("Login failed on component level:", err);
        }
    };
    
    // Effect to navigate user after successful login
    React.useEffect(() => {
        if (user) {
            if (user.role === Role.ALUNO) {
                navigate('/portal/dashboard', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [user, navigate]);
    
    const handleUserTypeChange = (type: UserType) => {
        setUserType(type);
        setCredential(''); // Clear credential field on type change
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
                    <div className="flex items-center justify-center p-1 bg-slate-700 rounded-lg mb-6">
                        <button onClick={() => handleUserTypeChange('student')} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition ${userType === 'student' ? 'bg-primary-600 text-white' : 'text-slate-300'}`}>
                            Sou Aluno
                        </button>
                        <button onClick={() => handleUserTypeChange('staff')} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition ${userType === 'staff' ? 'bg-primary-600 text-white' : 'text-slate-300'}`}>
                            Sou da Equipe
                        </button>
                    </div>

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
                            />
                        </div>

                        {userType === 'student' ? (
                            <div className="mb-6">
                                <label htmlFor="cpf" className="block mb-2 text-sm font-medium text-slate-300">CPF</label>
                                <input 
                                    type="text"
                                    id="cpf" 
                                    value={credential}
                                    onChange={(e) => setCredential(formatCPF(e.target.value))}
                                    className="w-full p-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                />
                            </div>
                        ) : (
                             <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="text-sm font-medium text-slate-300">Senha</label>
                                    <a href="#" onClick={(e) => e.preventDefault()} className="text-sm text-primary-500 hover:underline focus:outline-none">
                                        Esqueci minha senha
                                    </a>
                                </div>
                                <div className="relative">
                                    <input 
                                        type={passwordVisible ? 'text' : 'password'}
                                        id="password" 
                                        value={credential}
                                        onChange={(e) => setCredential(e.target.value)}
                                        className="w-full p-3 pr-10 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Sua senha"
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
                        )}
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition font-semibold disabled:bg-primary-800 disabled:cursor-not-allowed"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
