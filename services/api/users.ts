import { User, Role } from '../../types';
import apiClient from '../apiClient';

type UserData = Omit<User, 'id' | 'ativo'> & { password?: string };

export const getUsers = async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
};

export const addUser = async (userData: UserData): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', userData);
    return data;
};

export const updateUser = async (userId: string, userData: UserData): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${userId}`, userData);
    return data;
};

export const toggleUserStatus = async (userId: string): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/users/${userId}/status`);
    return data;
};

export const deleteUser = async (userId: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/users/${userId}`);
    return data;
};
