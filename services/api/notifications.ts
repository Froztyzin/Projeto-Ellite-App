

import { Notification } from '../../types';

const API_URL = '/api';

export const getNotificationHistory = async (): Promise<Notification[]> => {
    const response = await fetch(`${API_URL}/notifications`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch notification history');
    }
    return response.json();
};

export const generateNotifications = async (settings: { remindersEnabled: boolean; daysBeforeDue: number; overdueEnabled: boolean; }): Promise<{ generatedCount: number }> => {
    // In a real backend architecture, this would likely be a cron job.
    // This endpoint simulates triggering that job.
    const response = await fetch(`${API_URL}/notifications/generate`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to generate notifications');
    }
    return response.json();
};

export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    const response = await fetch(`${API_URL}/students/${studentId}/notifications`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch student notifications');
    }
    return response.json();
};
