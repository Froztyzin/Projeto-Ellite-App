import { Notification } from '../../types';
import apiClient from '../apiClient';

export const getNotificationHistory = async (): Promise<Notification[]> => {
    const { data } = await apiClient.get<Notification[]>('/notifications');
    return data;
};

export const generateNotifications = async (settings: { remindersEnabled: boolean; daysBeforeDue: number; overdueEnabled: boolean; }): Promise<{ generatedCount: number }> => {
    const { data } = await apiClient.post<{ generatedCount: number }>('/notifications/generate', settings);
    return data;
};

export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    const { data } = await apiClient.get<Notification[]>(`/portal/notifications/${studentId}`);
    return data;
};
