import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpenses, addExpense, updateExpense } from '../../services/mockApi';
import { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { FaPlus, FaPencilAlt, FaFileCsv } from 'react-icons/fa';
import ExpenseModal from '../shared/ExpenseModal';
import Papa from 'papaparse';
import { useToast } from '../../contexts/ToastContext';
import SkeletonTable from '../shared/skeletons/SkeletonTable';
import EmptyState from '../shared/EmptyState';

const ExpenseRow = React.memo(({ expense, onEdit }: { expense: Expense; onEdit: (expense: Expense) => void; }) => {
    return (
        <tr className="hover:bg-slate-700/50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatDate(new Date(expense.data))}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{expense.descricao}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{expense.categoria}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-500">{formatCurrency(expense.valor)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onClick={() => onEdit(expense)} className="text-primary-500 hover:text-primary-400" title="Editar Despesa">
                    <FaPencilAlt className="w-4 h-4"/>
                </button>
            </td>
        </tr>
    );
});
ExpenseRow.displayName = 'ExpenseRow';

const Expenses: React.FC = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const { data: expenses = [], isLoading } = useQuery({
      queryKey: ['expenses'],
      queryFn: getExpenses,
    });

    const saveExpenseMutation = useMutation({
      mutationFn: (data: { expenseData: Omit<Expense, 'id'>, editingExpense: Expense | null }) =>
        data.editingExpense 
          ? updateExpense({ ...data.editingExpense, ...data.expenseData }) 
          : addExpense(data.expenseData),
      onSuccess: () => {
        addToast('Despesa salva com sucesso!', 'success');
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        queryClient.invalidateQueries({ queryKey: ['reportsData'] });
        setIsModalOpen(false);
        setEditingExpense(null);
      },
      onError: (error) => {
        addToast(`Erro ao salvar despesa: ${error.message}`, 'error');
      }
    });

    const handleOpenModalForNew = useCallback(() => {
        setEditingExpense(null);
        setIsModalOpen(true);
    }, []);

    const handleOpenModalForEdit = useCallback((expense: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    }, []);

    const handleSaveExpense = useCallback(async (expenseData: Omit<Expense, 'id'>) => {
        saveExpenseMutation.mutate({ expenseData, editingExpense });
    }, [editingExpense, saveExpenseMutation]);

    const handleExportCSV = useCallback(() => {
        const dataForCsv = expenses.map(expense => ({
            'Data': formatDate(new Date(expense.data)), 'Descrição': expense.descricao,
            'Categoria': expense.categoria, 'Fornecedor': expense.fornecedor,
            'Valor': expense.valor,
        }));
        const csv = Papa.unparse(dataForCsv, { header: true });
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'despesas.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Exportação de despesas iniciada.', 'success');
    }, [expenses, addToast]);

    return (
        <>
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 self-start">Despesas</h1>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button onClick={handleExportCSV} className="w-full sm:w-auto flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                            <FaFileCsv className="mr-2" /> Exportar
                        </button>
                        <button onClick={handleOpenModalForNew} className="w-full sm:w-auto flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
                            <FaPlus className="mr-2" /> Nova Despesa
                        </button>
                    </div>
                </div>
                
                {isLoading ? <SkeletonTable headers={['Data', 'Descrição', 'Categoria', 'Valor', 'Ações']} /> : (
                <div className="overflow-x-auto">
                    {expenses.length > 0 ? (
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Data</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Descrição</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Categoria</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Valor</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-slate-700">
                            {expenses.map((expense) => (
                                <ExpenseRow key={expense.id} expense={expense} onEdit={handleOpenModalForEdit} />
                            ))}
                        </tbody>
                    </table>
                    ) : (
                         <EmptyState 
                            title="Nenhuma despesa registrada"
                            message="Comece a registrar as despesas para manter suas finanças organizadas."
                            actionText="Adicionar Despesa"
                            onAction={handleOpenModalForNew}
                        />
                    )}
                </div>
                )}
            </div>
            <ExpenseModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveExpense}
                expense={editingExpense}
                isSaving={saveExpenseMutation.isPending}
            />
        </>
    );
};

export default Expenses;
