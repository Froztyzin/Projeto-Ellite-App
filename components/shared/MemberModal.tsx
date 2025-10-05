import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Member, Plan } from '../../types';
import { getPlans } from '../../services/api/plans';
import { getEnrollmentByMemberId } from '../../services/api/members';
import { FaTimes } from 'react-icons/fa';
import { formatCPF, formatCurrency } from '../../lib/utils';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id' | 'ativo' | 'password'> & { password?: string }, planId: string | null) => Promise<void>;
  member: Member | null;
  isSaving: boolean;
}

const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, onSave, member, isSaving }) => {
    const getInitialState = () => ({
        nome: '', cpf: '', dataNascimento: '', email: '', telefone: '', observacoes: '', password: ''
    });
    
    const [formData, setFormData] = useState(getInitialState());
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [cpfError, setCpfError] = useState('');

    const { data: plans = [] } = useQuery<Plan[]>({
        queryKey: ['plans'],
        queryFn: getPlans,
        enabled: isOpen,
    });
    
    const validateCpf = (cpf: string): string => {
        const cleanedCpf = cpf.replace(/\D/g, '');
        if (cleanedCpf && cleanedCpf.length !== 11) {
            return 'O CPF deve conter 11 dígitos.';
        }
        return '';
    };
    
    useEffect(() => {
        if (isOpen && member) {
            const fetchEnrollment = async () => {
                const enrollment = await getEnrollmentByMemberId(member.id);
                setSelectedPlanId(enrollment?.plan.id || null);
            };
            fetchEnrollment();
        }
    }, [isOpen, member]);

    useEffect(() => {
        if (member && isOpen) {
            setFormData({
                nome: member.nome, cpf: formatCPF(member.cpf),
                dataNascimento: new Date(member.dataNascimento).toISOString().split('T')[0],
                email: member.email, telefone: member.telefone, observacoes: member.observacoes || '',
                password: ''
            });
        } else {
            setFormData(getInitialState());
            setSelectedPlanId(null);
        }
        setCpfError('');
    }, [member, isOpen]);

    // Fix: Add HTMLTextAreaElement to handle the `observacoes` field.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'cpf') {
            const formattedCpf = formatCPF(value);
            setFormData(prev => ({ ...prev, [name]: formattedCpf }));
            if (cpfError) {
                setCpfError(validateCpf(formattedCpf));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const currentCpfError = validateCpf(formData.cpf);
        if (currentCpfError) {
            setCpfError(currentCpfError);
            return;
        }

        if (!formData.dataNascimento) {
            alert("Por favor, preencha a data de nascimento.");
            return;
        }
        
        const date = new Date(formData.dataNascimento);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const correctedDate = new Date(date.getTime() + userTimezoneOffset);
        
        const memberPayload = { 
            ...formData, 
            cpf: formData.cpf.replace(/\D/g, ''), 
            dataNascimento: correctedDate,
        };

        if(!memberPayload.password) {
            delete memberPayload.password;
        }

        await onSave(memberPayload, selectedPlanId);
    };

    if (!isOpen) return null;

    const activePlans = plans.filter(p => p.ativo || (member && selectedPlanId === p.id));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-100">{member ? 'Editar Aluno' : 'Adicionar Novo Aluno'}</h3>
                    <button onClick={onClose} className="text-slate-400 bg-transparent hover:bg-slate-600 hover:text-slate-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <FaTimes className="w-5 h-5" /><span className="sr-only">Fechar modal</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto">
                    <div className="grid gap-4 mb-4 grid-cols-1 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label htmlFor="nome" className="block mb-2 text-sm font-medium text-slate-300">Nome Completo</label>
                            <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" required />
                        </div>
                        <div>
                            <label htmlFor="cpf" className="block mb-2 text-sm font-medium text-slate-300">CPF</label>
                            <input 
                                type="text" name="cpf" id="cpf" value={formData.cpf} onChange={handleChange} 
                                className={`bg-slate-700 border text-slate-200 text-sm rounded-lg block w-full p-2.5 ${cpfError ? 'border-red-500' : 'border-slate-600'}`} 
                                required placeholder="000.000.000-00" maxLength={14}
                             />
                             {cpfError && <p className="mt-2 text-sm text-red-500">{cpfError}</p>}
                        </div>
                        <div>
                            <label htmlFor="dataNascimento" className="block mb-2 text-sm font-medium text-slate-300">Data de Nascimento</label>
                            <input type="date" name="dataNascimento" id="dataNascimento" value={formData.dataNascimento} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" required />
                        </div>
                         <div className="sm:col-span-2">
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-slate-300">Email</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" required />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="telefone" className="block mb-2 text-sm font-medium text-slate-300">Telefone</label>
                            <input type="tel" name="telefone" id="telefone" value={formData.telefone} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" required />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-slate-300">Senha</label>
                            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" placeholder={member ? "Deixe em branco para não alterar" : "Senha de acesso do aluno"} required={!member} />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="plan" className="block mb-2 text-sm font-medium text-slate-300">Plano</label>
                            <select
                                id="plan"
                                name="plan"
                                value={selectedPlanId || ''}
                                onChange={(e) => setSelectedPlanId(e.target.value || null)}
                                className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                            >
                                <option value="">Nenhum / Cancelar Matrícula</option>
                                {activePlans.map(plan => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.nome} ({formatCurrency(plan.precoBase)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="observacoes" className="block mb-2 text-sm font-medium text-slate-300">Observações</label>
                            <textarea name="observacoes" id="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" />
                        </div>
                    </div>
                     <div className="flex items-center space-x-4 pt-4 border-t border-slate-700">
                        <button type="submit" disabled={isSaving} className="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-primary-700/50">
                            {isSaving ? 'Salvando...' : (member ? 'Salvar Alterações' : 'Salvar Aluno')}
                        </button>
                        <button type="button" onClick={onClose} className="text-slate-300 bg-transparent hover:bg-slate-700 focus:ring-4 focus:outline-none focus:ring-slate-600 rounded-lg border border-slate-600 text-sm font-medium px-5 py-2.5 hover:text-white focus:z-10">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MemberModal;
