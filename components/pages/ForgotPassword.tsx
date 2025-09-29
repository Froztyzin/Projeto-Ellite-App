import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChartPie, FaSpinner, FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import { forgotPassword } from '../../services/api/auth';
import { useToast } from '../../contexts/ToastContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await forgotPassword(email);
            addToast(response.message, 'success');
            setSubmitted(true);
        } catch (err: any) {
            addToast(err.response?.data?.message || 'Ocorreu um erro.', 'error');
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
                    {submitted ? (
                        <div className="text-center">
                            <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-slate-100 mb-2">Verifique seu Email</h2>
                            <p className="text-slate-300">
                                Se uma conta com o email fornecido existir, enviamos um link para você redefinir sua senha.
                            </p>
                            <Link to="/login" className="mt-6 inline-block text-primary-500 hover:underline">
                                Voltar para o Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-slate-100 mb-2">Recuperar Senha</h2>
                            <p className="text-slate-400 mb-6">Digite seu email para receber um link de redefinição.</p>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-slate-300">Email</label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full p-3 pl-10 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="seu@email.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition font-semibold disabled:bg-primary-800"
                                >
                                    {loading ? <FaSpinner className="animate-spin" /> : 'Enviar Link de Redefinição'}
                                </button>
                            </form>
                            <div className="text-center mt-6">
                                <Link to="/login" className="text-sm text-primary-500 hover:underline">
                                    Lembrou a senha? Voltar para o Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
