import { AuditLog } from '../../types';
import apiClient from '../apiClient';

export const getLogs = async (): Promise<AuditLog[]> => {
    const { data } = await apiClient.get<AuditLog[]>('/logs');
    return data;
};
