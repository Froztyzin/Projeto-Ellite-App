import { User } from '../../types';
import apiClient from '../apiClient';

interface LoginResponse {
    token: string;
    user: User;
}

export const login = async (email: string, credential: string, userType: 'student' | 'staff'): Promise<LoginResponse> => {
    // In a real app, the credential would be a password for staff and maybe CPF for students.
    // The backend would handle the validation.
    const payload = userType === 'staff'
        ? { email, password: credential }
        : { email, cpf: credential.replace(/\D/g, '') };

    const { data } = await apiClient.post<LoginResponse>(`/auth/login/${userType}`, payload);
    return data;
};

export const logout = (): void => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
};
