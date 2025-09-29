import { AuditLog } from '../../types';
import * as mockApi from '../mockApi';

export const getLogs = async (): Promise<AuditLog[]> => {
    return mockApi.getLogs();
};
