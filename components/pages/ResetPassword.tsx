import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaChartPie, FaSpinner, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { resetPassword } from '../../services/api/auth';
import { useToast } from '../../contexts/ToastContext';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();

    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Supabase sends tokens in the URL fragment like: #access_token=...&...
        const hash = location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            if (accessToken) {
                setToken(accessToken);
            } else {
                setError("Token de redefinição inválido ou ausente. Por favor, solicite um novo link.");
            }
        }
    }, [location]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!token) {
            setError("Token de redefinição inválido. Por favor, use o link do seu email.");
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            const response = await resetPassword(token, password);
            addToast(response.message, 'success');
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Ocorreu um erro ao redefinir a senha.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/login" className="flex items-center justify-center mb-4">
                        <FaChartPie className="text-5xl text-primary-500" />
                        <h1 className="ml-4 text-3xl font-bold text-white">Elitte Corpus</h1>
                    </Link>
                </div>

                <div className="bg-card p-8 rounded-lg shadow-lg border border-slate-700">
                    {success ? (
                        <div className="text-center">
                            <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-slate-100 mb-2">Senha Redefinida!</h2>
                            <p className="text-slate-300">
                                Sua senha foi alterada com sucesso. Você será redirecionado para a página de login.
                            </p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-slate-100 mb-2">Crie uma Nova Senha</h2>
                            <p className="text-slate-400 mb-6">Sua nova senha deve ser diferente da anterior.</p>
                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center">
                                        <FaExclamationTriangle className="mr-2" /> {error}
                                    </div>
                                )}
                                <div className="mb-4 relative">
                                    <label htmlFor="password" className="block mb-2 text-sm font-medium text-slate-300">Nova Senha</label>
                                    <input
                                        type={passwordVisible ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-3 pr-10 rounded-lg border border-slate-600 bg-slate-700 text-slate-200"
                                        required
                                    />
                                     <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute bottom-3 right-3 text-slate-400">
                                        {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                                     </button>
                                </div>
                                <div className="mb-6">
                                    <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-slate-300">Confirme a Nova Senha</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-200"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !token}
                                    className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 font-semibold disabled:bg-slate-500"
                                >
                                    {loading ? <FaSpinner className="animate-spin" /> : 'Redefinir Senha'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;