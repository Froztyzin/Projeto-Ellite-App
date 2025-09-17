import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import { FaTimes } from 'react-icons/fa';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<User, 'id' | 'ativo'> & { password?: string }) => Promise<void>;
  user: User | null;
  isSaving: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, isSaving }) => {
    const getInitialState = () => ({
        nome: '', email: '', role: Role.RECEPCAO, password: '', confirmPassword: ''
    });
    
    const [formData, setFormData] = useState(getInitialState());
    const [passwordError, setPasswordError] = useState('');

    // Security enhancement: Only these roles can be assigned through the UI.
    // Prevents creating new Admins from the user management screen.
    const assignableRoles = [Role.FINANCEIRO, Role.RECEPCAO];

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                nome: user.nome, email: user.email, role: user.role, password: '', confirmPassword: ''
            });
        } else {
            setFormData(getInitialState());
        }
        setPasswordError('');
    }, [user, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (formData.password || !user) { // Validate password if it's being set/changed or for a new user
            if (formData.password.length < 6) {
                setPasswordError('A senha deve ter pelo menos 6 caracteres.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setPasswordError('As senhas não coincidem.');
                return;
            }
        }
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword, ...userData } = formData;
        await onSave(userData);
    };

    if (!isOpen) return null;
    
    // An existing admin's role cannot be changed from this modal.
    const isRoleSelectDisabled = user?.role === Role.ADMIN;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-100">{user ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h3>
                    <button onClick={onClose} className="text-slate-400 p-1.5 rounded-full hover:bg-slate-600"><FaTimes /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 sm:p-5">
                    <div className="grid gap-4 mb-4 grid-cols-1 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label htmlFor="nome" className="block mb-2 text-sm font-medium text-slate-300">Nome Completo</label>
                            <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg block w-full p-2.5" required />
                        </div>
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-slate-300">Email</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg block w-full p-2.5" required />
                        </div>
                        <div>
                            <label htmlFor="role" className="block mb-2 text-sm font-medium text-slate-300">Cargo</label>
                            <select 
                                name="role" 
                                id="role" 
                                value={formData.role} 
                                onChange={handleChange} 
                                disabled={isRoleSelectDisabled}
                                className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg block w-full p-2.5 capitalize disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {user?.role === Role.ADMIN && <option value={Role.ADMIN} className="capitalize">Admin</option>}
                                {assignableRoles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                            </select>
                            {isRoleSelectDisabled && <p className="text-xs text-slate-400 mt-1">O cargo de Admin não pode ser alterado.</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-sm text-slate-400 mb-2">{user ? 'Alterar Senha (opcional)' : 'Senha'}</p>
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-slate-300">Nova Senha</label>
                            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg block w-full p-2.5" required={!user} />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-slate-300">Confirmar Senha</label>
                            <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg block w-full p-2.5" required={!user} />
                        </div>
                        {passwordError && <p className="sm:col-span-2 text-sm text-red-500">{passwordError}</p>}
                    </div>
                    <div className="flex items-center space-x-4">
                        <button type="submit" disabled={isSaving} className="text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50">
                            {isSaving ? 'Salvando...' : (user ? 'Salvar Alterações' : 'Salvar Usuário')}
                        </button>
                        <button type="button" onClick={onClose} className="text-slate-300 bg-transparent hover:bg-slate-700 rounded-lg border border-slate-600 text-sm font-medium px-5 py-2.5 hover:text-white">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
