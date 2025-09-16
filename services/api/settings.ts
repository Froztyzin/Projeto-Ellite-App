import { simulateDelay } from './database';

const SETTINGS_KEY = 'ACADEMIA_SETTINGS';

const defaultSettings = {
    remindersEnabled: true,
    daysBeforeDue: 3,
    overdueEnabled: true,
    useEmail: true,
    useWhatsapp: true,
    gymName: "Elitte Corpus Academia",
    gymCnpj: "00.000.000/0001-00",
    lateFee: "2",
    interestRate: "0.1",
    pixKey: "seu-email@provedor.com", // Example PIX key
};

export const getSettings = async (): Promise<any> => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    return simulateDelay(settings);
};

export const saveSettings = async (settings: any): Promise<void> => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return simulateDelay(undefined);
};