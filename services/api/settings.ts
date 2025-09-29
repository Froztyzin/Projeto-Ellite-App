import * as mockApi from '../mockApi';

export const getSettings = async (): Promise<any> => {
    return mockApi.getSettings();
};

export const saveSettings = async (settings: any): Promise<void> => {
    return mockApi.saveSettings(settings);
};
