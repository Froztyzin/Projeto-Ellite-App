import { AuditLog } from '../../types';
import apiClient from '../apiClient';

export const getLogs = async (): Promise<AuditLog[]> => {
    const response = await apiClient.get('/logs');
    return response.data;
};
