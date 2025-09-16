

import { AuditLog } from '../../types';

const API_URL = '/api';

export const getLogs = async (): Promise<AuditLog[]> => {
    const response = await fetch(`${API_URL}/logs`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch logs');
    }
    return response.json();
};

// addLog is removed from the frontend.
// The backend will be responsible for creating log entries when its endpoints are called.
