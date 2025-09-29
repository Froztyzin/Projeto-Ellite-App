import apiClient from '../apiClient';

export const getDashboardData = async () => {
    const { data } = await apiClient.get('/api/dashboard');
    return data;
};