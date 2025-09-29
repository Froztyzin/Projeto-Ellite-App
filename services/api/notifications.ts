import { Notification } from '../../types';
import * as mockApi from '../mockApi';

export const getNotificationHistory = async (): Promise<Notification[]> => {
    return mockApi.getNotificationHistory();
};

export const generateNotifications = async (settings: { remindersEnabled: boolean; daysBeforeDue: number; overdueEnabled: boolean; }): Promise<{ generatedCount: number }> => {
    return mockApi.generateNotifications(settings);
};

export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    return mockApi.getNotificationsForStudent(studentId);
};
