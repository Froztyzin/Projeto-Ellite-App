
const GENERAL_SETTINGS_KEY = 'gym_general_settings';
const PAYMENT_SETTINGS_KEY = 'gym_payment_settings';

// --- General Settings ---
export const getGeneralSettings = (): Promise<any> => {
    return new Promise(resolve => {
        const settings = localStorage.getItem(GENERAL_SETTINGS_KEY);
        resolve(settings ? JSON.parse(settings) : {});
    });
};
export const saveGeneralSettings = (settings: any): Promise<void> => {
    return new Promise(resolve => {
        localStorage.setItem(GENERAL_SETTINGS_KEY, JSON.stringify(settings));
        resolve();
    });
}

// --- Payment Settings ---
export const getPaymentSettings = (): Promise<{ pixKey: string } | null> => {
    return new Promise(resolve => {
        const settings = localStorage.getItem(PAYMENT_SETTINGS_KEY);
        resolve(settings ? JSON.parse(settings) : null);
    });
};
export const savePaymentSettings = (settings: { pixKey: string }): Promise<void> => {
    return new Promise(resolve => {
        localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(settings));
        resolve();
    });
};

// Database backup and restore functionality is now handled by Supabase.
// These functions are removed to avoid conflicts and data integrity issues.
