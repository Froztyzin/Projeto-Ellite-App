import { Notification, NotificationType, NotificationChannel, NotificationStatus, InvoiceStatus, Member, Invoice } from '../../types';
import { supabase } from '../supabaseClient';

export const getNotificationHistory = async (): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*, members(*), invoices(*)')
        .order('sentAt', { ascending: false });

    if (error) {
        console.error("Error fetching notification history:", error);
        return [];
    }

    // Map Supabase response to application types
    return data.map(n => ({
        ...n,
        member: n.members as any,
        invoice: n.invoices as any
    }));
};

const createNotification = async (member: Member, invoice: Invoice, type: NotificationType): Promise<void> => {
    const notificationsToInsert = [
        { member_id: member.id, invoice_id: invoice.id, type, channel: NotificationChannel.EMAIL, status: NotificationStatus.ENVIADA, sentAt: new Date().toISOString() },
        { member_id: member.id, invoice_id: invoice.id, type, channel: NotificationChannel.WHATSAPP, status: NotificationStatus.ENVIADA, sentAt: new Date().toISOString() }
    ];
    await supabase.from('notifications').insert(notificationsToInsert);
};

export const generateNotifications = async (settings: { remindersEnabled: boolean; daysBeforeDue: number; overdueEnabled: boolean; }): Promise<{ generatedCount: number }> => {
    let generatedCount = 0;
    const today = new Date();
    
    const { data: openInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, members(*)')
        .in('status', [InvoiceStatus.ABERTA, InvoiceStatus.ATRASADA]);
    
    if (invoicesError || !openInvoices) return { generatedCount: 0 };

    for (const invoice of openInvoices) {
        const dueDate = new Date(invoice.vencimento);
        const member = invoice.members as any as Member;
        
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const { data: existingNotification } = await supabase
            .from('notifications')
            .select('id')
            .eq('invoice_id', invoice.id)
            .eq('type', diffDays <= 0 ? NotificationType.ALERTA_ATRASO : NotificationType.LEMBRETE_VENCIMENTO)
            .limit(1);

        if (existingNotification && existingNotification.length > 0) continue;

        if (settings.remindersEnabled && invoice.status === InvoiceStatus.ABERTA && diffDays > 0 && diffDays <= settings.daysBeforeDue) {
            await createNotification(member, invoice, NotificationType.LEMBRETE_VENCIMENTO);
            generatedCount++;
        } else if (settings.overdueEnabled && diffDays <= 0) { // Overdue invoices
            await createNotification(member, invoice, NotificationType.ALERTA_ATRASO);
            generatedCount++;
        }
    }

    return { generatedCount };
};

export const getNotificationsForStudent = async (studentId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*, members(*), invoices(*)')
        .eq('member_id', studentId)
        .order('sentAt', { ascending: false });

    if (error) {
        console.error("Error fetching student notifications:", error);
        return [];
    }

    return data.map(n => ({
        ...n,
        member: n.members as any,
        invoice: n.invoices as any
    }));
};
