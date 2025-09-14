import React, { useState, useEffect } from 'react';
import { Plan, PlanPeriodicity } from '../../types';
import { FaTimes } from 'react-icons/fa';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Omit<Plan, 'id' | 'ativo'>) => void;
  plan: Plan | null; // For editing
  isSaving: boolean;
}

const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, onSave, plan, isSaving }) => {
    const getInitialState = () => ({
        nome: '',
        periodicidade: PlanPeriodicity.MENSAL,
        precoBase: '',
    });
    
    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (plan && isOpen) {
            setFormData({
                nome: plan.nome,
                periodicidade: plan.periodicidade,
                precoBase: String(plan.precoBase),
            });
        } else {
            setFormData(getInitialState());
        }
    }, [plan, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const price = parseFloat(formData.precoBase);
        if (isNaN(price) || price < 0) {
            alert("Por favor, insira um preço válido.");
            return;
        }

        onSave({
            nome: formData.nome,
            periodicidade: formData.periodicidade,
            precoBase: price,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-full overflow-y-auto">
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-100">
                        {plan ? 'Editar Plano' : 'Adicionar Novo Plano'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 bg-transparent hover:bg-slate-600 hover:text-slate-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <FaTimes className="w-5 h-5" />
                        <span className="sr-only">Fechar modal</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 sm:p-5">
                    <div className="grid gap-4 mb-4 grid-cols-1">
                        <div>
                            <label htmlFor="nome" className="block mb-2 text-sm font-medium text-slate-300">Nome do Plano</label>
                            <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" placeholder="Ex: Plano Anual Gold" required />
                        </div>
                        <div>
                            <label htmlFor="periodicidade" className="block mb-2 text-sm font-medium text-slate-300">Periodicidade</label>
                            <select name="periodicidade" id="periodicidade" value={formData.periodicidade} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" required>
                                {Object.values(PlanPeriodicity).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="precoBase" className="block mb-2 text-sm font-medium text-slate-300">Preço Base (R$)</label>
                            <input type="number" name="precoBase" id="precoBase" step="0.01" value={formData.precoBase} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" placeholder="99.90" required />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button type="submit" disabled={isSaving} className="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-primary-700/50">
                            {isSaving ? 'Salvando...' : (plan ? 'Salvar Alterações' : 'Salvar Plano')}
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

export default PlanModal;