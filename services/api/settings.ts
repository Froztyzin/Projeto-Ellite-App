import apiClient from '../apiClient';

export const getSettings = async (): Promise<any> => {
    const response = await apiClient.get('/settings');
    return response.data;
};

export const saveSettings = async (settings: any): Promise<void> => {
    await apiClient.post('/settings', settings);
};
