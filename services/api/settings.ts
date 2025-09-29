import apiClient from '../apiClient';

export const getSettings = async (): Promise<any> => {
    const { data } = await apiClient.get('/api/settings');
    return data;
};

export const saveSettings = async (settings: any): Promise<void> => {
    await apiClient.post('/api/settings', settings);
};