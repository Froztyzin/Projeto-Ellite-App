import { User } from '../../types';
import * as mockApi from '../mockApi';

type UserData = Omit<User, 'id' | 'ativo'> & { password?: string };

export const getUsers = async (): Promise<User[]> => {
    return mockApi.getUsers();
};

export const addUser = async (userData: UserData): Promise<User> => {
    return mockApi.addUser(userData);
};

export const updateUser = async (userId: string, userData: UserData): Promise<User> => {
    return mockApi.updateUser(userId, userData);
};

export const toggleUserStatus = async (userId: string): Promise<User> => {
    return mockApi.toggleUserStatus(userId);
};

export const deleteUser = async (userId: string): Promise<{ success: boolean }> => {
    return mockApi.deleteUser(userId);
};
