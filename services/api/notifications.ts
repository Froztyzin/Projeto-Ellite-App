import { Notification, NotificationType, NotificationChannel, NotificationStatus, InvoiceStatus } from '../../types';
import { supabase } from '../supabaseClient';
import { fromNotification, fromInvoice, toNotification } from './mappers';

export const getNotificationHistory = async (): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*, members(*), invoices(*)')
        .order('sent_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data.map(fromNotification);
};

export const generateNotifications = async (settings: { remindersEnabled: boolean; daysBeforeDue: number; overdueEnabled: boolean; }): Promise<{ generatedCount: number }> => {
    let generatedCount = 0;
    const today = new Date();
    
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*, members(*)')
        .in('status', [InvoiceStatus.ABERTA, InvoiceStatus.ATRASADA]);

    if (error) throw new Error(error.message);

    const notificationsToInsert = [];

    for (const invoiceData of invoices) {
        const invoice = fromInvoice(invoiceData);

        if (settings.remindersEnabled && invoice.status === InvoiceStatus.ABERTA) {
            const dueDate = new Date(invoice.vencimento);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0 && diffDays <= settings.daysBeforeDue) {
                const { count } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('invoice_id', invoice.id)
                    .eq('type', NotificationType.LEMBRETE_VENCIMENTO);
                
                if (count === 0) {
                    notificationsToInsert.push(toNotification({
                        member: invoice.member, invoice, type: NotificationType.LEMBRETE_VENCIMENTO, 
                        channel: NotificationChannel.EMAIL, status: NotificationStatus.ENVIADA, sentAt: new Date(),
                    }));
                    notificationsToInsert.push(toNotification({
                        member: invoice.member, invoice, type: NotificationType.LEMBRETE_VENCIMENTO, 
                        channel: NotificationChannel.WHATSAPP, status: NotificationStatus.ENVIADA, sentAt: new Date(),
                    }));
                    generatedCount++;
                }
            }
        }

        if (settings.overdueEnabled && invoice.status === InvoiceStatus.ATRASADA) {
             const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('invoice_id', invoice.id)
                .eq('type', NotificationType.ALERTA_ATRASO);
            
             if (count === 0) {
                notificationsToInsert.push(toNotification({
                    member: invoice.member, invoice, type: NotificationType.ALERTA_ATRASO,
                    channel: NotificationChannel.EMAIL, status: NotificationStatus.ENVIADA, sentAt: new Date(),
                }));
                notificationsToInsert.push(toNotification({
                    member: invoice.member, invoice, type: NotificationType.ALERTA_ATRASO,
                    channel: NotificationChannel.WHATSAPP, status: NotificationStatus.ENVIADA, sentAt: new Date(),
                }));
                generatedCount++;
            }
        }
    }

    if (notificationsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('notifications').insert(notificationsToInsert);
        if (insertError) console.error("Failed to insert notifications:", insertError);
    }
    
    return { generatedCount };
};

export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*, members(*), invoices(*)')
        .eq('member_id', studentId)
        .order('sent_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data.map(fromNotification);
};
