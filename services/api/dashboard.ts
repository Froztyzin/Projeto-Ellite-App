import apiClient from '../apiClient';

export const getDashboardData = async () => {
    const { data } = await apiClient.get('/dashboard');
    return data;
};
