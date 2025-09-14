import { allMembers, plans, enrollments, invoices, expenses, notifications, restoreDatabase, restoreDates } from './database';
import { simulateDelay } from './database';

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


// --- Backup and Restore ---
export const exportDatabase = async (): Promise<any> => {
    const database = { allMembers, plans, enrollments, invoices, expenses, notifications };
    const generalSettings = await getGeneralSettings();
    const paymentSettings = await getPaymentSettings();
    
    return simulateDelay({
        ...database,
        generalSettings,
        paymentSettings,
    });
};

export const importDatabase = (backupData: any): Promise<{ success: boolean; message: string }> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!backupData.allMembers || !backupData.invoices || !backupData.plans) {
                throw new Error("Arquivo de backup inválido ou corrompido.");
            }

            const restoredData = restoreDates(backupData);
            restoreDatabase(restoredData);

            if (backupData.generalSettings) {
                await saveGeneralSettings(backupData.generalSettings);
            }
            if (backupData.paymentSettings) {
                await savePaymentSettings(backupData.paymentSettings);
            }
            
            resolve({ success: true, message: "Dados importados com sucesso!" });

        } catch (error) {
            console.error("Import error:", error);
            reject({ success: false, message: (error as Error).message || "Falha ao importar dados." });
        }
    });
};