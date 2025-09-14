import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { getStudentProfileData, updateStudentProfile } from '../../../services/api/members';
import { formatDate } from '../../../lib/utils';
import { FaUserEdit, FaSpinner, FaSave } from 'react-icons/fa';
import PageLoader from '../../shared/skeletons/PageLoader';
import { useToast } from '../../../contexts/ToastContext';

const StudentProfile: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    
    const [formData, setFormData] = useState({ email: '', telefone: '' });

    const { data, isLoading, error } = useQuery({
        queryKey: ['studentProfile', user?.id],
        queryFn: () => {
            if (!user?.id) throw new Error("Usuário não encontrado");
            return getStudentProfileData(user.id);
        },
        enabled: !!user?.id,
    });

    useEffect(() => {
        if (data?.member) {
            setFormData({
                email: data.member.email,
                telefone: data.member.telefone,
            });
        }
    }, [data]);
    
    const mutation = useMutation({
        mutationFn: (updatedData: { email: string, telefone: string }) => {
            if (!user?.id) throw new Error("Usuário não encontrado");
            return updateStudentProfile(user.id, updatedData);
        },
        onSuccess: () => {
            addToast('Perfil atualizado com sucesso!', 'success');
            queryClient.invalidateQueries({ queryKey: ['studentProfile', user?.id] });
        },
        onError: (err) => {
             addToast(`Erro ao atualizar perfil: ${err.message}`, 'error');
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };
    
    if (isLoading) return <PageLoader />;

    if (error || !data) {
        return <div className="text-red-400 text-center p-8 bg-card rounded-lg">Erro ao carregar seu perfil.</div>;
    }

    const { member } = data;
    const isChanged = member.email !== formData.email || member.telefone !== formData.telefone;

    return (
        <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6 flex items-center">
                <FaUserEdit className="mr-4 text-primary-500"/> Meu Perfil
            </h1>

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Read-only fields */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400">Nome Completo</label>
                        <p className="mt-1 text-lg text-slate-200">{member.nome}</p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-400">CPF</label>
                        <p className="mt-1 text-lg text-slate-200">{member.cpf}</p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-400">Data de Nascimento</label>
                        <p className="mt-1 text-lg text-slate-200">{formatDate(new Date(member.dataNascimento))}</p>
                    </div>

                    <div className="border-t border-slate-700 pt-6 space-y-6">
                        {/* Editable fields */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 w-full p-2.5 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="telefone" className="block text-sm font-medium text-slate-300">Telefone</label>
                            <input
                                type="tel"
                                id="telefone"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleChange}
                                className="mt-1 w-full p-2.5 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-700">
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!isChanged || mutation.isPending}
                            className="flex justify-center items-center bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition font-semibold disabled:bg-slate-500 disabled:cursor-not-allowed"
                        >
                            {mutation.isPending ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                            {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default StudentProfile;
