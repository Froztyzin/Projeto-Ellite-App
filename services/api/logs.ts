import { AuditLog } from '../../types';
import apiClient from '../apiClient';

export const getLogs = async (): Promise<AuditLog[]> => {
    const response = await apiClient.get('/api/logs');
    return response.data;
};