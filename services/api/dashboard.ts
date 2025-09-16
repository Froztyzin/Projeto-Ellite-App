

const API_URL = '/api';

export const getDashboardData = async () => {
    const response = await fetch(`${API_URL}/dashboard`);
    if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch dashboard data');
    }
    return response.json();
};
