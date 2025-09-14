import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Member, Plan } from '../../types';
import { getPlans } from '../../services/api/plans';
import { getEnrollmentByMemberId } from '../../services/api/members';
import { FaTimes } from 'react-icons/fa';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id' | 'ativo'>, planId: string | null) => Promise<void>;
  member: Member | null;
  isSaving: boolean;
}

const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, onSave, member, isSaving }) => {
    const getInitialState = () => ({
        nome: '', cpf: '', dataNascimento: '', email: '', telefone: '',
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
        const cleanedCpf = cpf.replace(/\D/g, ''); // Remove non-digits
        if (cleanedCpf.length !== 11) {
            return 'O CPF deve conter exatamente 11 dígitos numéricos.';
        }
        return ''; // No error
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
                nome: member.nome, cpf: member.cpf,
                dataNascimento: new Date(member.dataNascimento).toISOString().split('T')[0],
                email: member.email, telefone: member.telefone,
            });
        } else {
            setFormData(getInitialState());
            setSelectedPlanId(null);
        }
        // Reset CPF error whenever modal opens or member changes
        setCpfError('');
    }, [member, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'cpf') {
            // Only validate on change if there was already an error, to avoid being too aggressive
            if (cpfError) {
                setCpfError(validateCpf(value));
            }
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const currentCpfError = validateCpf(formData.cpf);
        if (currentCpfError) {
            setCpfError(currentCpfError);
            return; // Stop submission if CPF is invalid
        }

        if (!formData.dataNascimento) {
            alert("Por favor, preencha a data de nascimento.");
            return;
        }
        
        const date = new Date(formData.dataNascimento);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const correctedDate = new Date(date.getTime() + userTimezoneOffset);

        await onSave({ ...formData, cpf: formData.cpf.replace(/\D/g, ''), dataNascimento: correctedDate }, selectedPlanId);
    };

    if (!isOpen) return null;

    const activePlans = plans.filter(p => p.ativo || (member && selectedPlanId === p.id));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-100">{member ? 'Editar Aluno' : 'Adicionar Novo Aluno'}</h3>
                    <button onClick={onClose} className="text-slate-400 bg-transparent hover:bg-slate-600 hover:text-slate-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <FaTimes className="w-5 h-5" /><span className="sr-only">Fechar modal</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 sm:p-5">
                    <div className="grid gap-4 mb-4 grid-cols-1 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label htmlFor="nome" className="block mb-2 text-sm font-medium text-slate-300">Nome Completo</label>
                            <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" required />
                        </div>
                        <div>
                            <label htmlFor="cpf" className="block mb-2 text-sm font-medium text-slate-300">CPF (apenas números)</label>
                            <input 
                                type="text" 
                                name="cpf" 
                                id="cpf" 
                                value={formData.cpf} 
                                onChange={handleChange} 
                                className={`bg-slate-700 border text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 ${cpfError ? 'border-red-500 focus:border-red-500' : 'border-slate-600'}`} 
                                required
                                aria-invalid={!!cpfError}
                                aria-describedby="cpf-error"
                             />
                             {cpfError && <p id="cpf-error" className="mt-2 text-sm text-red-500">{cpfError}</p>}
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
                            <label htmlFor="planId" className="block mb-2 text-sm font-medium text-slate-300">Plano</label>
                            <select id="planId" name="planId" value={selectedPlanId || ''} onChange={(e) => setSelectedPlanId(e.target.value)} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5">
                                <option value="">Sem plano</option>
                                {activePlans.map(plan => (<option key={plan.id} value={plan.id}>{plan.nome} ({formatCurrency(plan.precoBase)})</option>))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
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

const formatCurrency = (value: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default MemberModal;