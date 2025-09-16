import { AuditLog, LogActionType, Role } from '../../types';
import { logs, saveDatabase, simulateDelay } from './database';
import { faker } from '@faker-js/faker/locale/pt_BR';

export const getLogs = async (): Promise<AuditLog[]> => {
    return simulateDelay([...logs]); // Return a copy
};

export const addLog = async (action: LogActionType, details: string): Promise<void> => {
    try {
        let userName = 'Sistema';
        // Fix: Changed userRole type from 'Role | "system"' to 'Role' and initialized with Role.SYSTEM enum.
        let userRole: Role = Role.SYSTEM;

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            userName = parsedUser.nome;
            userRole = parsedUser.role;
        }
        
        const logEntry: AuditLog = {
            id: faker.string.uuid(),
            timestamp: new Date(),
            userName,
            userRole,
            action,
            details,
        };

        logs.unshift(logEntry);
        if (logs.length > 200) logs.pop();
        saveDatabase();

    } catch (error) {
        console.error("Error in addLog function:", error);
    }
};