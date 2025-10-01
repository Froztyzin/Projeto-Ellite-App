import { User } from '../../types';
import apiClient from '../apiClient';

type UserData = Omit<User, 'id' | 'ativo'> & { password?: string };

export const getUsers = async (): Promise<User[]> => {
    const response = await apiClient.get('users');
    return response.data;
};

export const addUser = async (userData: UserData): Promise<User> => {
    const response = await apiClient.post('users', userData);
    return response.data;
};

export const updateUser = async (userId: string, userData: UserData): Promise<User> => {
    const response = await apiClient.put(`users/${userId}`, userData);
    return response.data;
};

export const toggleUserStatus = async (userId: string): Promise<User> => {
    const response = await apiClient.patch(`users/${userId}/status`);
    return response.data;
};

export const deleteUser = async (userId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`users/${userId}`);
    return response.data;
};