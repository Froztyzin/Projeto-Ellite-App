import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMembers } from '../../services/api/members';
import { getWorkoutPlans } from '../../services/api/workout';
import { Member, Role, WorkoutPlan } from '../../types';
import { FaDumbbell, FaSearch, FaPlus, FaEye, FaPencilAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import useSortableData from '../../hooks/useSortableData';
import Pagination from '../shared/Pagination';
import SkeletonTable from '../shared/skeletons/SkeletonTable';
import EmptyState from '../shared/EmptyState';
import WorkoutPlanModal from '../shared/WorkoutPlanModal';

const ITEMS_PER_PAGE = 10;

const WorkoutPlans: React.FC = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [existingPlan, setExistingPlan] = useState<WorkoutPlan | null>(null);

    const { data: members = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ['members', debouncedSearchQuery, 'ALL'],
        queryFn: () => getMembers(debouncedSearchQuery, 'ALL'),
    });

    const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
        queryKey: ['workoutPlans'],
        queryFn: getWorkoutPlans,
    });

    const memberPlans = useMemo(() => {
        const planMap = new Map<string, WorkoutPlan>();
        plans.forEach(plan => planMap.set(plan.memberId, plan));
        return planMap;
    }, [plans]);

    const { items: sortedMembers, requestSort, sortConfig } = useSortableData(members, { key: 'nome', direction: 'ascending' });

    const paginatedMembers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedMembers, currentPage]);

    const handleOpenModal = (member: Member) => {
        setSelectedMember(member);
        setExistingPlan(memberPlans.get(member.id) || null);
        setIsModalOpen(true);
    };

    const isLoading = isLoadingMembers || isLoadingPlans;

    return (
        <>
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 self-start flex items-center">
                        <FaDumbbell className="mr-3" /> Planos de Treino
                    </h1>
                    <div className="relative w-full sm:w-auto">
                        <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por aluno..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                </div>

                {isLoading ? <SkeletonTable headers={['Aluno', 'Plano de Treino', 'Ações']} /> : (
                    <div className="overflow-x-auto">
                        {paginatedMembers.length > 0 ? (
                            <>
                                <table className="min-w-full divide-y divide-slate-700">
                                    <thead className="bg-slate-900/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Aluno</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Plano de Treino</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-card divide-y divide-slate-700">
                                        {paginatedMembers.map((member) => {
                                            const plan = memberPlans.get(member.id);
                                            return (
                                                <tr key={member.id} className="hover:bg-slate-700/50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Link to={`/members/${member.id}`} className="text-sm font-medium text-primary-500 hover:underline">{member.nome}</Link>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {plan ? (
                                                            <span className="text-green-400">{plan.planName}</span>
                                                        ) : (
                                                            <span className="text-slate-500">Nenhum plano atribuído</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button onClick={() => handleOpenModal(member)} className="flex items-center gap-2 bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition">
                                                            {plan ? <FaPencilAlt /> : <FaPlus />}
                                                            {plan ? 'Editar Plano' : 'Criar Plano'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <Pagination
                                    currentPage={currentPage}
                                    totalCount={sortedMembers.length}
                                    pageSize={ITEMS_PER_PAGE}
                                    onPageChange={page => setCurrentPage(page)}
                                />
                            </>
                        ) : (
                            <EmptyState
                                title="Nenhum aluno encontrado"
                                message="Não há alunos correspondentes à sua busca."
                            />
                        )}
                    </div>
                )}
            </div>
            {isModalOpen && (
                 <WorkoutPlanModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    member={selectedMember}
                    existingPlan={existingPlan}
                />
            )}
        </>
    );
};

export default WorkoutPlans;