import { Notification, NotificationType, NotificationChannel, NotificationStatus, InvoiceStatus } from '../../types';
import { notifications, invoices, saveDatabase } from './database';
import { simulateDelay } from './database';
import { faker } from '@faker-js/faker/locale/pt_BR';

export const getNotificationHistory = () => simulateDelay(notifications.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));

export const generateNotifications = (settings: { remindersEnabled: boolean; daysBeforeDue: number; overdueEnabled: boolean; }): Promise<{ generatedCount: number }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            let generatedCount = 0;
            const today = new Date();
            
            invoices.forEach(invoice => {
                if (settings.remindersEnabled && invoice.status === InvoiceStatus.ABERTA) {
                    const dueDate = new Date(invoice.vencimento);
                    const diffTime = dueDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays > 0 && diffDays <= settings.daysBeforeDue) {
                        const existingNotification = notifications.find(n => n.invoice.id === invoice.id && n.type === NotificationType.LEMBRETE_VENCIMENTO);
                        if (!existingNotification) {
                             [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP].forEach(channel => {
                                notifications.push({
                                    id: faker.string.uuid(), member: invoice.member, invoice,
                                    type: NotificationType.LEMBRETE_VENCIMENTO, channel,
                                    status: NotificationStatus.ENVIADA, sentAt: new Date(),
                                });
                            });
                            generatedCount++;
                        }
                    }
                }

                if (settings.overdueEnabled && invoice.status === InvoiceStatus.ATRASADA) {
                     const existingNotification = notifications.find(n => n.invoice.id === invoice.id && n.type === NotificationType.ALERTA_ATRASO);
                     if (!existingNotification) {
                        [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP].forEach(channel => {
                            notifications.push({
                                id: faker.string.uuid(), member: invoice.member, invoice,
                                type: NotificationType.ALERTA_ATRASO, channel,
                                status: NotificationStatus.ENVIADA, sentAt: new Date(),
                            });
                        });
                        generatedCount++;
                    }
                }
            });

            if (generatedCount > 0) {
                saveDatabase();
            }

            resolve({ generatedCount });
        }, 1000);
    });
};

export const getNotificationsForStudent = (studentId: string): Promise<Notification[]> => {
    const studentNotifications = notifications
        .filter(n => n.member.id === studentId)
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return simulateDelay(studentNotifications);
};