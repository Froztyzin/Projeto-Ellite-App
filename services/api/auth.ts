import { User, Role } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { LogActionType } from '../../types';
import { addLog } from './logs';

export const getProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

export const login = async (email: string, password: string):Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        if (error.message.includes("Invalid login credentials")) {
            throw new Error("Credenciais inválidas.");
        }
        throw error;
    }

    if (data.user) {
        const profile = await getProfile(data.user.id);
        if (profile) {
            await addLog(LogActionType.LOGIN, `Usuário ${profile.nome} fez login com sucesso.`);
            return {
                id: data.user.id,
                email: data.user.email!,
                nome: profile.nome,
                role: profile.role,
                ativo: profile.ativo
            };
        }
        // Fallback if profile doesn't exist, though this shouldn't happen with proper setup
        throw new Error('Perfil de usuário não encontrado.');
    }
    
    return null;
}