import { User, Role, Profile } from '../../types';
import { supabase } from '../supabaseClient';
import { addLog } from './logs';
import { LogActionType } from '../../types';
import { fromMember } from './mappers';

export const fetchUserProfile = async (authUser: any): Promise<User | null> => {
    // 1. Check for a staff profile first
    const { data: staffProfile, error: staffError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (staffError && staffError.code !== 'PGRST116') { // PGRST116 = 'Not a single row'
        console.error("Error fetching staff profile:", staffError);
        return null;
    }

    if (staffProfile) {
        return {
            id: authUser.id,
            email: authUser.email,
            nome: staffProfile.nome,
            role: staffProfile.role,
            ativo: staffProfile.ativo,
        };
    }

    // 2. If no staff profile, check for a student (member) profile
    const { data: memberProfile, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', authUser.id)
        .single();
    
    if (memberError && memberError.code !== 'PGRST116') {
        console.error("Error fetching member profile:", memberError);
        return null;
    }
    
    if (memberProfile) {
        const member = fromMember(memberProfile);
        return {
            id: member.id,
            email: member.email,
            nome: member.nome,
            role: Role.ALUNO,
            ativo: member.ativo,
        };
    }

    console.warn("No profile found for authenticated user:", authUser.id);
    return null;
};

export const login = async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
        throw new Error(error.message === 'Invalid login credentials' ? 'Credenciais inválidas.' : error.message);
    }
    if (!data.user) {
        throw new Error('Usuário não encontrado após o login.');
    }

    const userProfile = await fetchUserProfile(data.user);

    if (!userProfile) {
        await supabase.auth.signOut(); // Log out if no profile is found
        throw new Error('Perfil de usuário não encontrado. Acesso negado.');
    }
    
    await addLog(LogActionType.LOGIN, `Usuário ${userProfile.nome} fez login.`);

    return userProfile;
};
