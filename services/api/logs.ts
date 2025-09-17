import { AuditLog } from '../../types';
import { getDB, simulateDelay } from './database';

export const getLogs = async (): Promise<AuditLog[]> => {
    const db = getDB();
    // Logs are already sorted newest first in the database mock
    return simulateDelay(db.logs);
};

// addLog is handled directly in the mock database module
// when other API functions are called.
