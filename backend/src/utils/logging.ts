import { db } from '../data';
import { v4 as uuidv4 } from 'uuid';
import { LogActionType, Role } from '../types';

interface LogEntry {
  userName: string;
  userRole: Role;
  action: LogActionType;
  details: string;
}

export const addLog = async (entry: LogEntry): Promise<void> => {
  try {
    db.logs.push({
      id: uuidv4(),
      timestamp: new Date(),
      ...entry,
    });
  } catch (error) {
    console.error('Failed to write to audit log:', error);
  }
};
