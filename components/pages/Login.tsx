import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartPie, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleAccess = async (userType: 'admin' | 'student') => {
        setLocalLoading(true);
        setLocalError('');
        try {
            if (userType === 'admin') {
                await login('admin@elitte.com', 'password'); // Mock login
                navigate('/dashboard', { replace: true });
            } else {
                await login('aluno@elitte.com', 'password'); // Mock login
                navigate('/portal', { replace: true });
            }
        } catch (err: any) {
            const portalName = userType === 'admin' ? 'Painel Principal' : 'Portal do Aluno';
            setLocalError(err.message || `Falha ao entrar no ${portalName}. Verifique se os usuários de teste existem.`);
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
                    <p className="text-slate-400">Selecione o portal que deseja acessar.</p>
                </div>

                <div className="bg-card p-8 rounded-lg shadow-lg border border-slate-700">
                    {localError && (
                        <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center">
                            <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                            <span>{localError}</span>
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={() => handleAccess('admin')}
                            disabled={localLoading}
                            className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition font-semibold disabled:bg-primary-800 disabled:cursor-not-allowed"
                        >
                            {localLoading ? <FaSpinner className="animate-spin" /> : 'Acessar Painel Principal'}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAccess('student')}
                            disabled={localLoading}
                            className="w-full flex justify-center items-center bg-slate-600 text-white px-4 py-3 rounded-lg hover:bg-slate-500 transition font-semibold disabled:bg-slate-700 disabled:cursor-not-allowed"
                        >
                            {localLoading ? <FaSpinner className="animate-spin" /> : 'Acessar Portal do Aluno'}
                        </button>
                    </div>
                    
                    <p className="text-xs text-slate-500 text-center mt-6">
                        O login por email e senha foi desabilitado para demonstração.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;