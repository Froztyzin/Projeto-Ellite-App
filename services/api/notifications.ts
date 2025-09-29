import { Notification } from '../../types';
import apiClient from '../apiClient';

export const getNotificationHistory = async (): Promise<Notification[]> => {
    const { data } = await apiClient.get<Notification[]>('/api/notifications');
    return data;
};

export const generateNotifications = async (settings: { remindersEnabled: boolean; daysBeforeDue: number; overdueEnabled: boolean; }): Promise<{ generatedCount: number }> => {
    const { data } = await apiClient.post<{ generatedCount: number }>('/api/notifications/generate', settings);
    return data;
};

export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    const { data } = await apiClient.get<Notification[]>(`/api/portal/notifications/${studentId}`);
    return data;
};