import { supabase } from '../supabaseClient';

const SETTINGS_ID = 'singleton'; // Use a fixed ID for the single settings row

export const getGeneralSettings = async (): Promise<any> => {
    const { data, error } = await supabase
        .from('settings')
        .select('general_settings')
        .eq('id', SETTINGS_ID)
        .single();
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ? data.general_settings : {};
};

export const saveGeneralSettings = async (settings: any): Promise<void> => {
    const { error } = await supabase
        .from('settings')
        .upsert({ id: SETTINGS_ID, general_settings: settings }, { onConflict: 'id' });

    if (error) throw new Error(error.message);
};

export const getPaymentSettings = async (): Promise<{ pixKey: string } | any> => {
    const { data, error } = await supabase
        .from('settings')
        .select('payment_settings')
        .eq('id', SETTINGS_ID)
        .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ? data.payment_settings : {};
};

export const savePaymentSettings = async (settings: { pixKey: string }): Promise<void> => {
    const { error } = await supabase
        .from('settings')
        .upsert({ id: SETTINGS_ID, payment_settings: settings }, { onConflict: 'id' });
    
    if (error) throw new Error(error.message);
};
