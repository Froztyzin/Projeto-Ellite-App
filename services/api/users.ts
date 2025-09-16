import { User } from '../../types';

type UserData = Omit<User, 'id' | 'ativo'> & { password?: string };

const API_URL = '/api';

export const getUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) {
        throw new Error('Falha ao buscar usuários.');
    }
    return response.json();
};

export const addUser = async (userData: UserData): Promise<User> => {
    const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao adicionar usuário.');
    }
    return response.json();
};

export const updateUser = async (userId: string, userData: UserData): Promise<User> => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao atualizar usuário.');
    }
    return response.json();
};

export const toggleUserStatus = async (userId: string): Promise<User> => {
    const response = await fetch(`${API_URL}/users/${userId}/toggle-status`, { method: 'POST' });
    if (!response.ok) {
        throw new Error('Falha ao alterar status do usuário.');
    }
    return response.json();
};

export const deleteUser = async (userId: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao excluir usuário.');
    }
    return response.json();
};
