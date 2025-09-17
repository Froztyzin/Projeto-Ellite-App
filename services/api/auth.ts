import { User, Role } from '../../types';
import { getDB, addLog, simulateDelay } from './database';
import { LogActionType } from '../../types';

export const login = async (email: string, credential: string, userType: 'student' | 'staff'): Promise<User> => {
    const db = getDB();
    
    // Development bypass for easy setup
    if (userType === 'staff') {
        const adminUser = db.users.find(u => u.role === Role.ADMIN && u.ativo);
        if (!adminUser) {
             await simulateDelay({});
             throw new Error('Nenhum usuário administrador ativo encontrado.');
        }
        addLog(LogActionType.LOGIN, `Login de desenvolvimento (bypass) efetuado como ${adminUser.email}.`);
        return simulateDelay(adminUser);
    } else { // student
        const firstActiveMember = db.members.find(m => m.ativo);
        if(!firstActiveMember) {
            await simulateDelay({});
            throw new Error('Nenhum aluno ativo encontrado no sistema.');
        }
        const studentUser: User = {
            id: firstActiveMember.id,
            nome: firstActiveMember.nome,
            email: firstActiveMember.email,
            role: Role.ALUNO,
            ativo: firstActiveMember.ativo,
        };
        addLog(LogActionType.LOGIN, `Login de desenvolvimento (bypass) efetuado como ${studentUser.email}.`);
        return simulateDelay(studentUser);
    }
};

export const logout = (): void => {
    localStorage.removeItem('user');
};
