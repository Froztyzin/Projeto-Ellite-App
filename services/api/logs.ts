import { supabase } from '../../lib/supabaseClient';
import { LogActionType, AuditLog, Role } from '../../types';

export const getLogs = async (): Promise<AuditLog[]> => {
    const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
};

export const addLog = async (action: LogActionType, details: string) => {
    // In a real app with more complex user management, you might fetch the user's name/role
    // from a context or session. Here we simplify.
    const logEntry = {
        // userName and userRole would ideally be dynamically determined
        userName: 'Usuário do Sistema', 
        userRole: Role.ADMIN, 
        action,
        details,
    };
    
    const { error } = await supabase.from('logs').insert(logEntry);
    if (error) {
        console.error("Failed to add log:", error);
    }
};