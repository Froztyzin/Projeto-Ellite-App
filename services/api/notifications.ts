import { Notification, InvoiceStatus, NotificationType, NotificationChannel, NotificationStatus, LogActionType } from '../../types';
import { getDB, addLog, simulateDelay, saveDatabase } from './database';
import { faker } from '@faker-js/faker';

export const getNotificationHistory = async (): Promise<Notification[]> => {
    const db = getDB();
    const sorted = [...db.notifications].sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return simulateDelay(sorted);
};

export const generateNotifications = async (settings: { remindersEnabled: boolean; daysBeforeDue: number; overdueEnabled: boolean; }): Promise<{ generatedCount: number }> => {
    const db = getDB();
    let generatedCount = 0;
    const now = new Date();

    db.invoices.forEach(invoice => {
        // Check for overdue alerts
        if (settings.overdueEnabled && invoice.status === InvoiceStatus.ATRASADA) {
             // Avoid sending multiple alerts for the same overdue invoice
            const existing = db.notifications.find(n => n.invoice.id === invoice.id && n.type === NotificationType.ALERTA_ATRASO);
            if (!existing) {
                const newNotification: Notification = {
                    id: faker.string.uuid(),
                    member: invoice.member,
                    invoice: invoice,
                    type: NotificationType.ALERTA_ATRASO,
                    channel: NotificationChannel.EMAIL, // Or based on settings
                    status: NotificationStatus.ENVIADA,
                    sentAt: now,
                };
                db.notifications.push(newNotification);
                generatedCount++;
            }
        }

        // Check for due date reminders
        const dueDate = new Date(invoice.vencimento);
        const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        if (settings.remindersEnabled && invoice.status === InvoiceStatus.ABERTA && daysUntilDue > 0 && daysUntilDue <= settings.daysBeforeDue) {
            const existing = db.notifications.find(n => n.invoice.id === invoice.id && n.type === NotificationType.LEMBRETE_VENCIMENTO);
            if (!existing) {
                 const newNotification: Notification = {
                    id: faker.string.uuid(),
                    member: invoice.member,
                    invoice: invoice,
                    type: NotificationType.LEMBRETE_VENCIMENTO,
                    channel: NotificationChannel.WHATSAPP, // Or based on settings
                    status: NotificationStatus.ENVIADA,
                    sentAt: now,
                };
                db.notifications.push(newNotification);
                generatedCount++;
            }
        }
    });

    if (generatedCount > 0) {
        addLog(LogActionType.GENERATE, `${generatedCount} novas notificações foram geradas.`);
        saveDatabase();
    }
    
    return simulateDelay({ generatedCount });
};

export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    const db = getDB();
    const studentNotifications = db.notifications
        .filter(n => n.member.id === studentId)
        .sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return simulateDelay(studentNotifications);
};
