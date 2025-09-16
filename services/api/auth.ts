

import { User } from '../../types';

const API_URL = '/api';

export const login = async (email: string, credential: string, userType: 'student' | 'staff'): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, credential, userType }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha na autenticação.' }));
        throw new Error(errorData.message || 'Falha na autenticação.');
    }

    return response.json();
};

export const logout = (): void => {
    // In a real app with tokens, you'd also call a backend endpoint to invalidate the token.
    localStorage.removeItem('user');
};
