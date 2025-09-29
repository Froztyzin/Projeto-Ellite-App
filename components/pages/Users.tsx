import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, addUser, updateUser, toggleUserStatus, deleteUser } from '../../services/api/users';
import { User } from '../../types';
import { getActiveStatusBadge } from '../../lib/utils';
import { FaUserPlus, FaPencilAlt, FaToggleOn, FaToggleOff, FaTrashAlt, FaArrowLeft, FaExclamationTriangle, FaSpinner, FaTimes } from 'react-icons/fa';
import UserModal from '../shared/UserModal';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import SkeletonTable from '../shared/skeletons/SkeletonTable';
import EmptyState from '../shared/EmptyState';

const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  isConfirming: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, isConfirming }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-red-400 flex items-center"><FaExclamationTriangle className="mr-3" />{title}</h3>
          <button onClick={onClose} className="text-slate-400 p-1.5 rounded-full hover:bg-slate-600"><FaTimes /></button>
        </div>
        <div className="p-5 text-slate-300">{message}</div>
        <div className="flex items-center justify-end p-4 space-x-4 bg-slate-900/50 rounded-b-lg">
          <button type="button" onClick={onClose} disabled={isConfirming} className="text-slate-300 bg-transparent hover:bg-slate-700 rounded-lg border border-slate-600 text-sm font-medium px-5 py-2.5 hover:text-white disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={isConfirming} className="text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center disabled:bg-red-700/50">
            {isConfirming && <FaSpinner className="animate-spin mr-2" />}
            {isConfirming ? 'Excluindo...' : 'Sim, Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserRow = React.memo(({ user, onEdit, onToggleStatus, onDelete }: { user: User; onEdit: (user: User) => void; onToggleStatus: (id: string) => void; onDelete: (user: User) => void; }) => {
    return (
        <tr className="hover:bg-slate-700/50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{user.nome}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{user.email}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 capitalize">{user.role}</td>
            <td className="px-6 py-4 whitespace-nowrap text-center">{getActiveStatusBadge(user.ativo)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-3">
                    <button onClick={() => onToggleStatus(user.id)} className="text-slate-400 hover:text-slate-300" title={user.ativo ? 'Desativar' : 'Ativar'}>
                        {user.ativo ? <FaToggleOn className="w-5 h-5 text-green-500"/> : <FaToggleOff className="w-5 h-5"/>}
                    </button>
                    <button onClick={() => onEdit(user)} className="text-primary-500 hover:text-primary-400" title="Editar"><FaPencilAlt /></button>
                    <button onClick={() => onDelete(user)} className="text-red-500 hover:text-red-400" title="Excluir"><FaTrashAlt /></button>
                </div>
            </td>
        </tr>
    );
});
UserRow.displayName = 'UserRow';

const Users: React.FC = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });

    const mutationOptions = {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
        onError: (error: Error) => addToast(`Erro: ${error.message}`, 'error'),
    };

    const saveUserMutation = useMutation({
        mutationFn: (data: { userData: Omit<User, 'id' | 'ativo'> & { password?: string }, editingUser: User | null }) => 
            data.editingUser ? updateUser(data.editingUser.id, data.userData) : addUser(data.userData),
        ...mutationOptions,
        onSuccess: () => {
            addToast('Usuário salvo com sucesso!', 'success');
            setIsModalOpen(false);
            setEditingUser(null);
            mutationOptions.onSuccess();
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: toggleUserStatus, ...mutationOptions,
        onSuccess: () => { addToast('Status do usuário alterado.', 'success'); mutationOptions.onSuccess(); },
    });

    const deleteUserMutation = useMutation({
        mutationFn: deleteUser, ...mutationOptions,
        onSuccess: () => { addToast('Usuário excluído.', 'success'); setIsConfirmModalOpen(false); setUserToDelete(null); mutationOptions.onSuccess(); },
    });

    const handleOpenModalForNew = useCallback(() => { setEditingUser(null); setIsModalOpen(true); }, []);
    const handleOpenModalForEdit = useCallback((user: User) => { setEditingUser(user); setIsModalOpen(true); }, []);
    const handleToggleStatus = useCallback((userId: string) => toggleStatusMutation.mutate(userId), [toggleStatusMutation]);
    const handleSaveUser = useCallback(async (userData: Omit<User, 'id' | 'ativo'> & { password?: string }) => {
        saveUserMutation.mutate({ userData, editingUser });
    }, [editingUser, saveUserMutation]);
    const handleOpenDeleteModal = useCallback((user: User) => { setUserToDelete(user); setIsConfirmModalOpen(true); }, []);
    const handleConfirmDelete = useCallback(() => {
        if (userToDelete) deleteUserMutation.mutate(userToDelete.id);
    }, [userToDelete, deleteUserMutation]);

    return (
        <>
            <div className="mb-6">
                 <Link to="/settings" className="flex items-center text-sm font-medium text-primary-500 hover:text-primary-400"><FaArrowLeft className="mr-2" /> Voltar para Configurações</Link>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 self-start">Gerenciamento de Usuários</h1>
                    <button onClick={handleOpenModalForNew} className="w-full sm:w-auto flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
                        <FaUserPlus className="mr-2" /> Novo Usuário
                    </button>
                </div>

                {isLoading ? <SkeletonTable headers={['Nome', 'Email', 'Cargo', 'Status', 'Ações']} /> : (
                <div className="overflow-x-auto">
                    {users.length > 0 ? (
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Cargo</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-slate-700">
                            {users.map(user => (
                                <UserRow key={user.id} user={user} onEdit={handleOpenModalForEdit} onToggleStatus={handleToggleStatus} onDelete={handleOpenDeleteModal} />
                            ))}
                        </tbody>
                    </table>
                     ) : (
                         <EmptyState title="Nenhum usuário cadastrado" message="Adicione novos usuários para gerenciar o sistema." actionText="Adicionar Usuário" onAction={handleOpenModalForNew} />
                    )}
                </div>
                )}
            </div>
            <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} user={editingUser} isSaving={saveUserMutation.isPending} />
            <ConfirmModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message={<><p>Tem certeza que deseja excluir <strong>{userToDelete?.nome}</strong>?</p><p className="mt-2 text-sm text-yellow-400">Esta ação é irreversível.</p></>} isConfirming={deleteUserMutation.isPending} />
        </>
    );
};

export default Users;