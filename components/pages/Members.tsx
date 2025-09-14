import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMembers, toggleMemberStatus, addMember, updateMember } from '../../services/api/members';
import { Member, Role } from '../../types';
import { getActiveStatusBadge } from '../../lib/utils';
import { FaUserPlus, FaSearch, FaPencilAlt, FaToggleOn, FaToggleOff, FaEllipsisV, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import MemberModal from '../shared/MemberModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import useSortableData from '../../hooks/useSortableData';
import Pagination from '../shared/Pagination';
import SkeletonTable from '../shared/skeletons/SkeletonTable';
import EmptyState from '../shared/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
const ITEMS_PER_PAGE = 10;

const Members: React.FC = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
    const [currentPage, setCurrentPage] = useState(1);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);

    const { data: members = [], isLoading } = useQuery({
      queryKey: ['members', debouncedSearchQuery, statusFilter],
      queryFn: () => getMembers(debouncedSearchQuery, statusFilter),
    });

    const mutationOptions = {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['members'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      },
      onError: (error: Error) => addToast(`Erro: ${error.message}`, 'error'),
    };

    const toggleStatusMutation = useMutation({
      mutationFn: toggleMemberStatus,
      ...mutationOptions,
      onSuccess: () => {
        addToast('Status do aluno alterado com sucesso.', 'success');
        mutationOptions.onSuccess();
      },
    });

    const saveMemberMutation = useMutation({
      mutationFn: (data: { memberData: Omit<Member, 'id' | 'ativo'>, planId: string | null, editingMember: Member | null }) => 
        data.editingMember 
          ? updateMember({ ...data.editingMember, ...data.memberData }, data.planId) 
          : addMember(data.memberData, data.planId),
      ...mutationOptions,
      onSuccess: () => {
        addToast('Aluno salvo com sucesso!', 'success');
        setIsModalOpen(false);
        setEditingMember(null);
        mutationOptions.onSuccess();
      },
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId && menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    const handleOpenModalForNew = () => {
        setEditingMember(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (member: Member) => {
        setEditingMember(member);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };
    
    const handleToggleStatus = (memberId: string) => {
        setOpenMenuId(null);
        toggleStatusMutation.mutate(memberId);
    };

    const handleSaveMember = async (memberData: Omit<Member, 'id' | 'ativo'>, planId: string | null) => {
        saveMemberMutation.mutate({ memberData, planId, editingMember });
    };

    const { items: sortedMembers, requestSort, sortConfig } = useSortableData(members, { key: 'nome', direction: 'ascending' });
    
    const paginatedMembers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedMembers, currentPage]);

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort className="inline ml-1 opacity-40" />;
        if (sortConfig.direction === 'ascending') return <FaSortUp className="inline ml-1" />;
        return <FaSortDown className="inline ml-1" />;
    };

    return (
        <>
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 self-start">Alunos</h1>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                             <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
                             <input type="text" placeholder="Buscar por nome ou CPF..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"/>
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-full sm:w-auto p-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500">
                            <option value="ACTIVE">Ativos</option>
                            <option value="INACTIVE">Inativos</option>
                            <option value="ALL">Todos</option>
                        </select>
                        <button onClick={handleOpenModalForNew} className="w-full sm:w-auto flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
                            <FaUserPlus className="mr-2" /> Novo Aluno
                        </button>
                    </div>
                </div>
                
                {isLoading ? <SkeletonTable headers={['Nome', 'Email', 'Telefone', 'Status', 'Ações']} /> : (
                <div className="overflow-x-auto">
                   {paginatedMembers.length > 0 ? (
                    <>
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('nome')}>Nome {getSortIcon('nome')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">Telefone</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('ativo')}>Status {getSortIcon('ativo')}</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-slate-700">
                            {paginatedMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link to={`/members/${member.id}`} className="text-sm font-medium text-primary-500 hover:text-primary-400 hover:underline">{member.nome}</Link>
                                        <div className="text-sm text-slate-400 sm:hidden">{member.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 hidden sm:table-cell">{member.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 hidden lg:table-cell">{member.telefone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">{getActiveStatusBadge(member.ativo)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                       <button onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-slate-200" aria-haspopup="true" aria-expanded={openMenuId === member.id}>
                                            <FaEllipsisV />
                                       </button>
                                       {openMenuId === member.id && (
                                            <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-md shadow-lg border border-slate-600 z-10">
                                                <ul className="py-1">
                                                    <li>
                                                        <button onClick={() => handleOpenModalForEdit(member)} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">
                                                           <FaPencilAlt className="mr-3" /> Editar Aluno
                                                        </button>
                                                    </li>
                                                    {user && [Role.ADMIN, Role.FINANCEIRO].includes(user.role) && (
                                                        <li>
                                                            <button onClick={() => handleToggleStatus(member.id)} className={`w-full text-left flex items-center px-4 py-2 text-sm ${member.ativo ? 'text-red-400 hover:bg-red-900/50' : 'text-green-400 hover:bg-green-900/50'}`}>
                                                                {member.ativo ? <FaToggleOff className="mr-3"/> : <FaToggleOn className="mr-3"/>}
                                                                {member.ativo ? 'Desativar Aluno' : 'Ativar Aluno'}
                                                            </button>
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                       )}
                                    </td>
                                </tr>
                            ))}
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
                            message="Tente ajustar sua busca ou adicione um novo aluno para começar."
                            actionText="Adicionar Novo Aluno"
                            onAction={handleOpenModalForNew}
                        />
                    )}
                </div>
                )}
            </div>
            <MemberModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveMember}
                member={editingMember}
                isSaving={saveMemberMutation.isPending}
            />
        </>
    );
};

export default Members;