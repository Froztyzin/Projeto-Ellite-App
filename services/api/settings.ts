import { getDB, saveDatabase, simulateDelay, addLog } from './database';
import { LogActionType } from '../../types';

export const getSettings = async (): Promise<any> => {
    const db = getDB();
    return simulateDelay(db.settings || {});
};

export const saveSettings = async (settings: any): Promise<void> => {
    const db = getDB();
    db.settings = { ...db.settings, ...settings };
    addLog(LogActionType.UPDATE, 'Configurações do sistema foram atualizadas.');
    saveDatabase();
    // Fix: `simulateDelay` expects at least one argument. Passed `undefined` for a `void` return.
    return simulateDelay(undefined);
};