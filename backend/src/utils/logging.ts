import prisma from '../lib/prisma';
import { AuditLog, LogActionType, Role } from '../types';

interface LogEntry {
  userName: string;
  userRole: Role;
  action: LogActionType;
  details: string;
}

export const addLog = async (entry: LogEntry): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        ...entry,
      },
    });
  } catch (error) {
    console.error('Failed to write to audit log:', error);
  }
};
