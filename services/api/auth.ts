import { User } from '../../types';
import * as mockApi from '../mockApi';

interface LoginResponse {
    user: User;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
    return mockApi.login(email, password);
};

export const logout = async (): Promise<void> => {
    return mockApi.logout();
};

export const checkSession = async (): Promise<User> => {
    return mockApi.checkSession();
}

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
    return mockApi.forgotPassword(email);
}

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
    return mockApi.resetPassword(token, password);
}
