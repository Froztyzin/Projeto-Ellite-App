import React, { useState, useEffect } from 'react';
import { Expense } from '../../types';
import { FaTimes } from 'react-icons/fa';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>) => Promise<void>;
  expense: Expense | null; // For editing
  isSaving: boolean;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSave, expense, isSaving }) => {
    const getInitialState = () => ({
        descricao: '',
        categoria: 'Aluguel',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        fornecedor: '',
    });
    
    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (expense && isOpen) {
            setFormData({
                descricao: expense.descricao,
                categoria: expense.categoria,
                valor: String(expense.valor),
                data: new Date(expense.data).toISOString().split('T')[0],
                fornecedor: expense.fornecedor,
            });
        } else {
            setFormData(getInitialState());
        }
    }, [expense, isOpen]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const expenseValue = parseFloat(formData.valor);
        if (isNaN(expenseValue) || expenseValue <= 0) {
            alert("Por favor, insira um valor válido para a despesa.");
            return;
        }

        const date = new Date(formData.data);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const correctedDate = new Date(date.getTime() + userTimezoneOffset);

        await onSave({
          ...formData,
          valor: expenseValue,
          data: correctedDate,
        });
    };

    if (!isOpen) return null;

    const categories = ['Aluguel', 'Energia', 'Água', 'Equipamentos', 'Marketing', 'Salários', 'Limpeza', 'Outros'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-100">
                        {expense ? 'Editar Despesa' : 'Adicionar Nova Despesa'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 bg-transparent hover:bg-slate-600 hover:text-slate-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <FaTimes className="w-5 h-5" />
                        <span className="sr-only">Fechar modal</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 sm:p-5">
                    <div className="grid gap-4 mb-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label htmlFor="descricao" className="block mb-2 text-sm font-medium text-slate-300">Descrição</label>
                            <input type="text" name="descricao" id="descricao" value={formData.descricao} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" placeholder="Ex: Compra de anilhas" required />
                        </div>
                        <div>
                            <label htmlFor="categoria" className="block mb-2 text-sm font-medium text-slate-300">Categoria</label>
                            <select name="categoria" id="categoria" value={formData.categoria} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" required>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="valor" className="block mb-2 text-sm font-medium text-slate-300">Valor (R$)</label>
                            <input type="number" name="valor" id="valor" step="0.01" value={formData.valor} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" placeholder="150.00" required />
                        </div>
                        <div>
                           <label htmlFor="data" className="block mb-2 text-sm font-medium text-slate-300">Data da Despesa</label>
                            <input type="date" name="data" id="data" value={formData.data} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" required />
                        </div>
                        <div>
                            <label htmlFor="fornecedor" className="block mb-2 text-sm font-medium text-slate-300">Fornecedor</label>
                            <input type="text" name="fornecedor" id="fornecedor" value={formData.fornecedor} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" placeholder="Ex: Fitness Store" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button type="submit" disabled={isSaving} className="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-primary-700/50">
                            {isSaving ? 'Salvando...' : (expense ? 'Salvar Alterações' : 'Salvar Despesa')}
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

export default ExpenseModal;