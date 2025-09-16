import { User, Role } from '../../types';
import { mockUsers, allMembers } from './database';

// Unified login function to be called from the context
export const login = async (email: string, credential: string, userType: 'student' | 'staff'): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const normalizedEmail = email.toLowerCase().trim();

    if (userType === 'student') {
        const cleanedCpf = credential.replace(/\D/g, '');
        if (cleanedCpf.length !== 11) {
            throw new Error('CPF inválido. Deve conter 11 dígitos.');
        }
        
        const foundMember = allMembers.find(m => m.email.toLowerCase() === normalizedEmail && m.cpf === cleanedCpf);
        
        if (foundMember && foundMember.ativo) {
            // For students, their 'User' object for the app is derived from their 'Member' profile
            const studentUser: User = {
                id: foundMember.id,
                nome: foundMember.nome,
                email: foundMember.email,
                role: Role.ALUNO, // All members are students
                ativo: foundMember.ativo,
            };
            return studentUser;
        } else {
            throw new Error('Email ou CPF não encontrado, ou matrícula inativa.');
        }

    } else { // userType is 'staff'
        const foundUser = mockUsers.find(u => u.email.toLowerCase() === normalizedEmail);
        
        // In a mock environment, we might use a simple password check
        if (foundUser && credential === '123456') {
             if (!foundUser.ativo) {
                throw new Error('Este usuário está inativo.');
            }
            return foundUser;
        } else {
            throw new Error('Email ou senha inválidos.');
        }
    }
};


export const logout = (): void => {
    // Clear the user session from localStorage
    localStorage.removeItem('user');
};