import { Notification, NotificationType, NotificationChannel, NotificationStatus, InvoiceStatus } from '../../types';
import { supabase } from '../../lib/supabaseClient';

export const getNotificationHistory = async (): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*, member:members(*), invoice:invoices(*)')
        .order('sentAt', { ascending: false });
    
    if (error) throw error;
    return data as Notification[];
};

export const generateNotifications = async (settings: { remindersEnabled: boolean; daysBeforeDue: number; overdueEnabled: boolean; }): Promise<{ generatedCount: number }> => {
    let generatedCount = 0;
    const today = new Date();

    if (settings.remindersEnabled) {
        const reminderDate = new Date();
        reminderDate.setDate(today.getDate() + settings.daysBeforeDue);
        
        const { data: openInvoices } = await supabase
            .from('invoices')
            .select('id, member_id, competencia, member:members(*)')
            .eq('status', InvoiceStatus.ABERTA)
            .lte('vencimento', reminderDate.toISOString())
            .gte('vencimento', today.toISOString());
            
        for (const invoice of openInvoices || []) {
            // Check if a notification already exists
            const { data: existing } = await supabase.from('notifications').select('id').eq('invoice_id', invoice.id).eq('type', NotificationType.LEMBRETE_VENCIMENTO).limit(1);
            if (!existing || existing.length === 0) {
                 await supabase.from('notifications').insert([
                    { member_id: invoice.member_id, invoice_id: invoice.id, type: NotificationType.LEMBRETE_VENCIMENTO, channel: NotificationChannel.EMAIL, status: NotificationStatus.ENVIADA, sentAt: new Date().toISOString() },
                    { member_id: invoice.member_id, invoice_id: invoice.id, type: NotificationType.LEMBRETE_VENCIMENTO, channel: NotificationChannel.WHATSAPP, status: NotificationStatus.ENVIADA, sentAt: new Date().toISOString() }
                ]);
                generatedCount++;
            }
        }
    }

    if (settings.overdueEnabled) {
        const { data: overdueInvoices } = await supabase
            .from('invoices')
            .select('id, member_id, competencia, member:members(*)')
            .eq('status', InvoiceStatus.ATRASADA);
            
        for (const invoice of overdueInvoices || []) {
            const { data: existing } = await supabase.from('notifications').select('id').eq('invoice_id', invoice.id).eq('type', NotificationType.ALERTA_ATRASO).limit(1);
            if (!existing || existing.length === 0) {
                await supabase.from('notifications').insert([
                    { member_id: invoice.member_id, invoice_id: invoice.id, type: NotificationType.ALERTA_ATRASO, channel: NotificationChannel.EMAIL, status: NotificationStatus.ENVIADA, sentAt: new Date().toISOString() },
                    { member_id: invoice.member_id, invoice_id: invoice.id, type: NotificationType.ALERTA_ATRASO, channel: NotificationChannel.WHATSAPP, status: NotificationStatus.ENVIADA, sentAt: new Date().toISOString() }
                ]);
                generatedCount++;
            }
        }
    }
    
    return { generatedCount };
};

export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*, member:members(*), invoice:invoices(*)')
        .eq('member_id', studentId)
        .order('sentAt', { ascending: false });

    if (error) throw error;
    return data as Notification[];
};