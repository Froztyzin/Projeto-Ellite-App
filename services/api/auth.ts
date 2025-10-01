import { User } from '../../types';
import apiClient from '../apiClient';

interface LoginResponse {
    user: User;
}

export const login = async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<LoginResponse>('auth/login', { email, password });
    return response.data.user;
};

export const loginStudent = async (cpf: string): Promise<User> => {
    const response = await apiClient.post<LoginResponse>('auth/login-student', { cpf });
    return response.data.user;
};

export const logout = async (): Promise<void> => {
    await apiClient.post('auth/logout');
};

export const checkSession = async (): Promise<User> => {
    const response = await apiClient.get<User>('auth/me');
    return response.data;
}

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('auth/forgot-password', { email });
    return response.data;
}

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
        'auth/reset-password',
        { password },
        { headers: { 'x-access-token': token } }
    );
    return response.data;
}
