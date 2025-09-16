

const API_URL = '/api';

export const getSettings = async (): Promise<any> => {
    const response = await fetch(`${API_URL}/settings`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch settings');
    }
    return response.json();
};

export const saveSettings = async (settings: any): Promise<void> => {
    const response = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to save settings');
    }
};
