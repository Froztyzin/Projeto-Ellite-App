import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaChartPie, FaSpinner, FaExclamationTriangle, FaEnvelope, FaLock, FaAddressCard } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { formatCPF } from '../../lib/utils';

type Tab = 'admin' | 'student';

const Login: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('admin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cpf, setCpf] = useState('');

    const { login, loginStudent } = useAuth();
    const { settings } = useSettings();
    const navigate = useNavigate();

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setError('');
        // Clear form fields when switching tabs
        setEmail('');
        setPassword('');
        setCpf('');
    };

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Falha ao entrar no Painel Principal.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await loginStudent(cpf);
            navigate('/portal/dashboard', { replace: true });
        } catch (err: any)
 {
            setError(err.message || 'Falha ao entrar no Portal do Aluno.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCpf(formatCPF(e.target.value));
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <FaChartPie className="text-5xl text-primary-500" />
                        <h1 className="ml-4 text-3xl font-bold text-white">{settings?.gymName || 'Academia'}</h1>
                    </div>
                </div>

                <div className="bg-card rounded-lg shadow-lg border border-slate-700">
                    <div className="flex border-b border-slate-700">
                        <button
                            onClick={() => handleTabChange('admin')}
                            className={`w-1/2 py-4 text-center font-semibold transition-colors rounded-tl-lg ${activeTab === 'admin' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-400 hover:bg-slate-700/50'}`}
                        >
                            Administrativo
                        </button>
                        <button
                            onClick={() => handleTabChange('student')}
                            className={`w-1/2 py-4 text-center font-semibold transition-colors rounded-tr-lg ${activeTab === 'student' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-400 hover:bg-slate-700/50'}`}
                        >
                            Aluno
                        </button>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center">
                                <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        {activeTab === 'admin' ? (
                            <form onSubmit={handleAdminSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-slate-300">Email</label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400"/>
                                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 pl-10 rounded-lg border border-slate-600 bg-slate-700 text-slate-200" required/>
                                    </div>
                                </div>
                                <div>
                                     <label htmlFor="password" className="block mb-2 text-sm font-medium text-slate-300">Senha</label>
                                    <div className="relative">
                                        <FaLock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400"/>
                                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 pl-10 rounded-lg border border-slate-600 bg-slate-700 text-slate-200" required/>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Link to="/forgot-password" className="text-sm text-primary-500 hover:underline">Esqueceu a senha?</Link>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition font-semibold"
                                >
                                    {loading ? <FaSpinner className="animate-spin" /> : 'Entrar'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleStudentSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="cpf" className="block mb-2 text-sm font-medium text-slate-300">CPF</label>
                                     <div className="relative">
                                        <FaAddressCard className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400"/>
                                        <input type="text" id="cpf" placeholder="000.000.000-00" value={cpf} onChange={handleCpfChange} className="w-full p-3 pl-10 rounded-lg border border-slate-600 bg-slate-700 text-slate-200" required/>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition font-semibold"
                                >
                                    {loading ? <FaSpinner className="animate-spin" /> : 'Acessar Portal'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;