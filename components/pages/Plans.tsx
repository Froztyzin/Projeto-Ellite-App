import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlans, addPlan, updatePlan, togglePlanStatus } from '../../services/api/plans';
import { Plan } from '../../types';
import { formatCurrency, getActiveStatusBadge } from '../../lib/utils';
import { FaPlus, FaPencilAlt, FaToggleOn, FaToggleOff, FaArrowLeft, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import PlanModal from '../shared/PlanModal';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import SkeletonTable from '../shared/skeletons/SkeletonTable';
import EmptyState from '../shared/EmptyState';
import useSortableData from '../../hooks/useSortableData';

const PlanRow = React.memo(({ plan, onToggleStatus, onEdit }: { plan: Plan; onToggleStatus: (id: string) => void; onEdit: (plan: Plan) => void; }) => {
    return (
        <tr className="hover:bg-slate-700/50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{plan.nome}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{plan.periodicidade}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-300">{formatCurrency(plan.precoBase)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-center">{getActiveStatusBadge(plan.ativo)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-3">
                    <button onClick={() => onToggleStatus(plan.id)} className="text-slate-400 hover:text-slate-300" title={plan.ativo ? 'Desativar Plano' : 'Ativar Plano'}>
                        {plan.ativo ? <FaToggleOn className="w-5 h-5 text-green-500"/> : <FaToggleOff className="w-5 h-5"/>}
                    </button>
                    <button onClick={() => onEdit(plan)} className="text-primary-500 hover:text-primary-400" title="Editar Plano">
                        <FaPencilAlt className="w-4 h-4"/>
                    </button>
                </div>
            </td>
        </tr>
    );
});
PlanRow.displayName = 'PlanRow';

const Plans: React.FC = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const { data: plans = [], isLoading } = useQuery({
      queryKey: ['plans'],
      queryFn: getPlans,
    });

    const { items: sortedPlans, requestSort, sortConfig } = useSortableData(plans, { key: 'nome', direction: 'ascending' });

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort className="inline ml-1 opacity-40" />;
        if (sortConfig.direction === 'ascending') return <FaSortUp className="inline ml-1" />;
        return <FaSortDown className="inline ml-1" />;
    };

    const mutationOptions = {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
        onError: (error: Error) => addToast(`Erro: ${error.message}`, 'error'),
    };

    const toggleStatusMutation = useMutation({
        mutationFn: togglePlanStatus,
        ...mutationOptions,
        onSuccess: (updatedPlan) => {
            addToast(`Plano ${updatedPlan.ativo ? 'ativado' : 'desativado'} com sucesso.`, 'success');
            mutationOptions.onSuccess();
        },
    });

    const savePlanMutation = useMutation({
        mutationFn: (data: { planData: Omit<Plan, 'id' | 'ativo'>, editingPlan: Plan | null }) => 
            data.editingPlan 
                ? updatePlan({ ...data.editingPlan, ...data.planData }) 
                : addPlan(data.planData),
        ...mutationOptions,
        onSuccess: () => {
            addToast('Plano salvo com sucesso!', 'success');
            setIsModalOpen(false);
            setEditingPlan(null);
            mutationOptions.onSuccess();
        },
    });

    const handleOpenModalForNew = useCallback(() => {
        setEditingPlan(null);
        setIsModalOpen(true);
    }, []);

    const handleOpenModalForEdit = useCallback((plan: Plan) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    }, []);

    const handleToggleStatus = useCallback((planId: string) => {
        toggleStatusMutation.mutate(planId);
    }, [toggleStatusMutation]);

    const handleSavePlan = useCallback((planData: Omit<Plan, 'id' | 'ativo'>) => {
        savePlanMutation.mutate({ planData, editingPlan });
    }, [editingPlan, savePlanMutation]);

    return (
        <>
            <div className="mb-6">
                 <Link to="/settings" className="flex items-center text-sm font-medium text-primary-500 hover:text-primary-400">
                    <FaArrowLeft className="mr-2" /> Voltar para Configurações
                </Link>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 self-start">Gerenciamento de Planos</h1>
                    <button onClick={handleOpenModalForNew} className="w-full sm:w-auto flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
                        <FaPlus className="mr-2" /> Novo Plano
                    </button>
                </div>

                 {isLoading ? <SkeletonTable headers={['Nome', 'Periodicidade', 'Preço', 'Status', 'Ações']} /> : (
                <div className="overflow-x-auto">
                    {sortedPlans.length > 0 ? (
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('nome')}>Nome do Plano {getSortIcon('nome')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('periodicidade')}>Periodicidade {getSortIcon('periodicidade')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('precoBase')}>Preço {getSortIcon('precoBase')}</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('ativo')}>Status {getSortIcon('ativo')}</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-slate-700">
                            {sortedPlans.map((plan) => (
                                <PlanRow 
                                    key={plan.id}
                                    plan={plan}
                                    onEdit={handleOpenModalForEdit}
                                    onToggleStatus={handleToggleStatus}
                                />
                            ))}
                        </tbody>
                    </table>
                     ) : (
                         <EmptyState 
                            title="Nenhum plano cadastrado"
                            message="Crie planos para poder matricular novos alunos."
                            actionText="Adicionar Plano"
                            onAction={handleOpenModalForNew}
                        />
                    )}
                </div>
                )}
            </div>
            <PlanModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSavePlan}
                plan={editingPlan}
                isSaving={savePlanMutation.isPending}
            />
        </>
    );
};

export default Plans;