import { Notification, NotificationType, NotificationChannel, NotificationStatus, InvoiceStatus, Member, Invoice } from '../../types';
import { notifications, invoices, saveDatabase, simulateDelay } from './database';
import { faker } from '@faker-js/faker/locale/pt_BR';

export const getNotificationHistory = async (): Promise<Notification[]> => {
    const sorted = [...notifications].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return simulateDelay(sorted);
};

const createNotification = (member: Member, invoice: Invoice, type: NotificationType): void => {
    const newNotification: Notification = {
        id: faker.string.uuid(),
        member,
        invoice,
        type,
        channel: NotificationChannel.EMAIL, // Simplified for mock
        status: NotificationStatus.ENVIADA,
        sentAt: new Date(),
    };
    notifications.push(newNotification);
};

export const generateNotifications = async (settings: { remindersEnabled: boolean; daysBeforeDue: number; overdueEnabled: boolean; }): Promise<{ generatedCount: number }> => {
    let generatedCount = 0;
    const today = new Date();
    
    const openInvoices = invoices.filter(i => 
        [InvoiceStatus.ABERTA, InvoiceStatus.ATRASADA].includes(i.status)
    );

    for (const invoice of openInvoices) {
        const dueDate = new Date(invoice.vencimento);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const existingNotification = notifications.find(n =>
            n.invoice.id === invoice.id &&
            n.type === (diffDays <= 0 ? NotificationType.ALERTA_ATRASO : NotificationType.LEMBRETE_VENCIMENTO)
        );

        if (existingNotification) continue;

        if (settings.remindersEnabled && invoice.status === InvoiceStatus.ABERTA && diffDays > 0 && diffDays <= settings.daysBeforeDue) {
            createNotification(invoice.member, invoice, NotificationType.LEMBRETE_VENCIMENTO);
            generatedCount++;
        } else if (settings.overdueEnabled && diffDays <= 0) {
            createNotification(invoice.member, invoice, NotificationType.ALERTA_ATRASO);
            generatedCount++;
        }
    }

    if (generatedCount > 0) {
        saveDatabase();
    }

    return simulateDelay({ generatedCount });
};

export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    const studentNotifications = notifications
        .filter(n => n.member.id === studentId)
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return simulateDelay(studentNotifications);
};