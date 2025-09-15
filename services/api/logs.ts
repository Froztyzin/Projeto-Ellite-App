import { supabase } from '../supabaseClient';
import { AuditLog, LogActionType, User } from '../../types';
import { fromLog, toLog } from './mappers';

export const getLogs = async (): Promise<AuditLog[]> => {
    const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) throw new Error(error.message);
    return data.map(fromLog);
};

let currentUser: User | null = null;
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        const { data: { user } } = session;
        // In a real app, you would fetch the user's full profile here
        // For simplicity, we'll store a partial user object.
        currentUser = {
            id: user.id,
            email: user.email,
            nome: user.user_metadata.full_name || user.email, // Placeholder
            role: user.user_metadata.role || 'unknown', // Placeholder
            ativo: true
        };
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
    }
});


export const addLog = async (action: LogActionType, details: string) => {
    // Attempt to get the user from the current session if not available
    if (!currentUser) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
             currentUser = {
                id: session.user.id,
                email: session.user.email,
                nome: session.user.user_metadata.full_name || session.user.email,
                role: session.user.user_metadata.role || 'unknown',
                ativo: true,
            };
        }
    }
    
    const actor = currentUser || { nome: 'Sistema', role: 'system' };
    
    const logEntry = toLog({
        userName: actor.nome,
        userRole: actor.role,
        action,
        details,
    });
    
    const { error } = await supabase.from('logs').insert(logEntry);
    if (error) {
        console.error("Failed to add log:", error);
    }
};
