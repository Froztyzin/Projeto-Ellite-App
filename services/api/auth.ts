import { User } from '../../types';
import apiClient from '../apiClient';

interface LoginResponse {
    user: User;
    message: string;
}

export const login = async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
    return response.data.user;
};

export const loginStudent = async (cpf: string): Promise<User> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login-student', { cpf });
    return response.data.user;
};

export const logout = async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
};

export const checkSession = async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
}

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/auth/forgot-password', { email });
    return response.data;
}

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
        '/api/auth/reset-password',
        { password, token }
    );
    return response.data;
}