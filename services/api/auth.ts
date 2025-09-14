import { User, Role } from '../../types';
import { mockUsers, allMembers } from './database';

export const login = (email: string, password: string):Promise<User | null> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // 1. Try to log in as a team member first
            const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role !== Role.ALUNO);
            if (user && password === 'admin123') { // Simple password for mock team members
                resolve(JSON.parse(JSON.stringify(user)));
                return;
            }

            // 2. If team login fails, try to log in as a student
            const studentMember = allMembers.find(m => m.email.toLowerCase() === email.toLowerCase());
            if (studentMember && studentMember.cpf === password) {
                // If a student member is found, create the user object directly from the member data for the session.
                const studentUser: User = {
                    id: studentMember.id,
                    nome: studentMember.nome,
                    email: studentMember.email,
                    role: Role.ALUNO,
                    ativo: studentMember.ativo
                };
                resolve(JSON.parse(JSON.stringify(studentUser)));
                return;
            }

            // 3. If both fail, reject
            reject(new Error('Credenciais inválidas.'));
        }, 800);
    });
}