import { User, Role, LogActionType } from '../../types';
import { getDB, saveDatabase, addLog, simulateDelay } from './database';
import { faker } from '@faker-js/faker';

type UserData = Omit<User, 'id' | 'ativo'> & { password?: string };

export const getUsers = async (): Promise<User[]> => {
    const db = getDB();
    return simulateDelay(db.users.filter(u => u.role !== Role.ALUNO));
};

export const addUser = async (userData: UserData): Promise<User> => {
    const db = getDB();
    if (db.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        await simulateDelay({});
        throw new Error('Este e-mail já está em uso.');
    }

    const newUser: User = {
        id: faker.string.uuid(),
        nome: userData.nome,
        email: userData.email,
        role: userData.role,
        ativo: true,
    };

    db.users.push(newUser);
    addLog(LogActionType.CREATE, `Novo usuário da equipe criado: ${newUser.nome} (${newUser.email})`);
    saveDatabase();

    return simulateDelay(newUser);
};

export const updateUser = async (userId: string, userData: UserData): Promise<User> => {
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        await simulateDelay({});
        throw new Error('Usuário não encontrado.');
    }

    // Check for email conflict
    if (db.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase() && u.id !== userId)) {
        await simulateDelay({});
        throw new Error('Este e-mail já está em uso por outro usuário.');
    }

    const updatedUser = { ...db.users[userIndex], ...userData };
    db.users[userIndex] = updatedUser;

    addLog(LogActionType.UPDATE, `Dados do usuário ${updatedUser.nome} atualizados.`);
    saveDatabase();

    return simulateDelay(updatedUser);
};

export const toggleUserStatus = async (userId: string): Promise<User> => {
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        await simulateDelay({});
        throw new Error('Usuário não encontrado.');
    }
    
    const user = db.users[userIndex];
    user.ativo = !user.ativo;

    addLog(LogActionType.UPDATE, `Status do usuário ${user.nome} alterado para ${user.ativo ? 'ATIVO' : 'INATIVO'}.`);
    saveDatabase();

    return simulateDelay(user);
};

export const deleteUser = async (userId: string): Promise<{ success: boolean }> => {
    const db = getDB();
    const userToDelete = db.users.find(u => u.id === userId);
    if (!userToDelete) {
        await simulateDelay({});
        throw new Error('Usuário não encontrado.');
    }
    if (userToDelete.role === Role.ADMIN) {
         await simulateDelay({});
        throw new Error('Não é possível excluir um usuário Administrador.');
    }

    db.users = db.users.filter(u => u.id !== userId);

    addLog(LogActionType.DELETE, `Usuário da equipe ${userToDelete.nome} foi excluído.`);
    saveDatabase();

    return simulateDelay({ success: true });
};
