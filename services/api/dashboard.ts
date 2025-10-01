import apiClient from '../apiClient';

export const getDashboardData = async () => {
    const response = await apiClient.get('/api/dashboard');
    return response.data;
};