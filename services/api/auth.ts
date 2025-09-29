import { User } from '../../types';
import apiClient from '../apiClient';

interface LoginResponse {
    user: User;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
    return data;
};

export const logout = async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
};

export const checkSession = async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/api/auth/me');
    return data;
}

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/api/auth/forgot-password', { email });
    return data;
}

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/api/auth/reset-password/${token}`, { password });
    return data;
}