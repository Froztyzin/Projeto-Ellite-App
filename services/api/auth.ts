import { User } from '../../types';
import { supabase } from '../supabaseClient';

export const login = async (email: string, password: string): Promise<void> => {
    
    // The login process for all users (admin, student, etc.) is now unified.
    // Supabase handles the authentication, and the user's role is determined
    // by their profile in the database.
    const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
    });

    if (error) {
        if (error.message.includes('Invalid login credentials')) {
            throw new Error('Email ou senha inválidos.');
        }
        throw new Error(error.message);
    }
    
    // After successful login, the onAuthStateChange listener in AuthContext
    // will trigger to fetch the user's profile and update the application state.
};
