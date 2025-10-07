import { Notification } from '../../types';
import apiClient from '../apiClient';


export const getNotificationHistory = async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications');
    return response.data;
};

export const generateNotifications = async (settings: { remindersEnabled: boolean; daysBeforeDue: number; overdueEnabled: boolean; }): Promise<{ generatedCount: number }> => {
    const response = await apiClient.post('/notifications/generate', settings);
    return response.data;
};

export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    const response = await apiClient.get(`/portal/notifications/${studentId}`);
    return response.data;
};