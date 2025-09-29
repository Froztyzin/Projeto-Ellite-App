import { Router } from 'express';
import { NotificationChannel, NotificationStatus, NotificationType, InvoiceStatus } from '../types';
import authMiddleware from '../middleware/authMiddleware';
import { db } from '../data';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const notificationsWithDetails = db.notifications.map(n => {
            const member = db.members.find(m => m.id === n.memberId);
            const invoice = db.invoices.find(i => i.id === n.invoiceId);
            return {
                ...n,
                member: { nome: member?.nome || 'N/A' },
                invoice: { competencia: invoice?.competencia || 'N/A' },
            };
        }).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

        res.json(notificationsWithDetails);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar notificações.' });
    }
});

router.post('/generate', authMiddleware, async (req, res) => {
    const { remindersEnabled, daysBeforeDue, overdueEnabled } = req.body;
    let generatedCount = 0;
    const now = new Date();

    try {
        if (remindersEnabled) {
            const reminderDateStart = new Date();
            reminderDateStart.setHours(0,0,0,0);
            const reminderDateEnd = new Date();
            reminderDateEnd.setDate(now.getDate() + daysBeforeDue);
            reminderDateEnd.setHours(23,59,59,999);
            
            const reminderInvoices = db.invoices.filter(i => {
                const vencimento = new Date(i.vencimento);
                const hasReminder = db.notifications.some(n => n.invoiceId === i.id && n.type === NotificationType.LEMBRETE_VENCIMENTO);
                return (
                    vencimento >= reminderDateStart &&
                    vencimento <= reminderDateEnd &&
                    i.status === InvoiceStatus.ABERTA &&
                    !hasReminder
                );
            });

            for (const invoice of reminderInvoices) {
                db.notifications.push({
                    id: uuidv4(),
                    memberId: invoice.memberId,
                    invoiceId: invoice.id,
                    type: NotificationType.LEMBRETE_VENCIMENTO,
                    channel: NotificationChannel.EMAIL,
                    status: NotificationStatus.ENVIADA,
                    sentAt: new Date(),
                });
                generatedCount++;
            }
        }

        if (overdueEnabled) {
             const overdueInvoices = db.invoices.filter(i => {
                const vencimento = new Date(i.vencimento);
                const hasOverdueAlert = db.notifications.some(n => n.invoiceId === i.id && n.type === NotificationType.ALERTA_ATRASO);
                return (
                    vencimento < now &&
                    i.status === InvoiceStatus.ATRASADA &&
                    !hasOverdueAlert
                );
            });

            for (const invoice of overdueInvoices) {
                db.notifications.push({
                    id: uuidv4(),
                    memberId: invoice.memberId,
                    invoiceId: invoice.id,
                    type: NotificationType.ALERTA_ATRASO,
                    channel: NotificationChannel.EMAIL,
                    status: NotificationStatus.ENVIADA,
                    sentAt: new Date(),
                });
                generatedCount++;
            }
        }
        
        console.log(`${generatedCount} novas notificações geradas (simulação).`);
        res.json({ generatedCount });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao gerar notificações' });
    }
});

export default router;
