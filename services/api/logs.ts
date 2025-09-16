import { AuditLog, LogActionType, Role } from '../../types';
import { supabase } from '../supabaseClient';

export const getLogs = async (): Promise<AuditLog[]> => {
    const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);

    if (error) {
        console.error("Error fetching logs:", error);
        throw new Error("Não foi possível buscar o log de atividades.");
    }
    // Ensure timestamp is a Date object
    return data.map(log => ({...log, timestamp: new Date(log.timestamp)}));
};

export const addLog = async (action: LogActionType, details: string): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        let userName = 'Sistema';
        let userRole: Role | 'system' = 'system';

        if (user) {
            // Fetch profile from cache first, then from DB if needed
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.id === user.id) {
                    userName = parsedUser.nome;
                    userRole = parsedUser.role;
                }
            } else {
                 const { data: profile } = await supabase
                    .from('profiles')
                    .select('nome, role')
                    .eq('id', user.id)
                    .single();
                if (profile) {
                    userName = profile.nome;
                    userRole = profile.role;
                }
            }
        }
        
        const logEntry = {
            userName,
            userRole,
            action,
            details,
        };

        const { error } = await supabase.from('logs').insert(logEntry);
        if (error) {
            console.error("Failed to add log:", error);
        }
    } catch (error) {
        console.error("Error in addLog function:", error);
    }
};
