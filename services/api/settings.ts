import { supabase } from '../supabaseClient';

// We assume a 'settings' table with a single row, identified by a fixed ID.
const SETTINGS_ID = 1;

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
    pixKey: "",
};

export const getSettings = async (): Promise<any> => {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .maybeSingle();

    if (error) {
        console.error("Error fetching settings:", error);
        return defaultSettings;
    }
    return data || defaultSettings;
};

export const saveSettings = async (settings: any): Promise<void> => {
    // Remove the id from the settings object if it exists to avoid issues with the upsert
    const { id, ...settingsToSave } = settings;

    const { error } = await supabase
        .from('settings')
        .upsert({ id: SETTINGS_ID, ...settingsToSave });
        
    if (error) {
        console.error("Error saving settings:", error);
        throw new Error("Não foi possível salvar as configurações.");
    }
};

// These functions are deprecated but kept for compatibility during transition.
// They now use the unified settings functions.
export const getGeneralSettings = getSettings;
export const saveGeneralSettings = saveSettings;
export const getPaymentSettings = async (): Promise<{ pixKey: string }> => {
    const settings = await getSettings();
    return { pixKey: settings.pixKey || "" };
};
export const savePaymentSettings = async (settings: { pixKey: string }): Promise<void> => {
    const currentSettings = await getSettings();
    await saveSettings({ ...currentSettings, ...settings });
};
