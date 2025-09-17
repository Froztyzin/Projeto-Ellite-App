import { Router } from 'express';
import prisma from '../lib/prisma';
import { NotificationChannel, NotificationStatus, NotificationType, InvoiceStatus } from '../types';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            include: {
                member: { select: { nome: true } },
                invoice: { select: { competencia: true } },
            },
            orderBy: { sentAt: 'desc' }
        });
        res.json(notifications);
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
            const reminderDate = new Date();
            reminderDate.setDate(now.getDate() + daysBeforeDue);

            const reminderInvoices = await prisma.invoice.findMany({
                where: {
                    vencimento: { gte: now, lte: reminderDate },
                    status: InvoiceStatus.ABERTA,
                    notifications: { none: { type: NotificationType.LEMBRETE_VENCIMENTO } }
                }
            });

            for (const invoice of reminderInvoices) {
                await prisma.notification.create({
                    data: {
                        memberId: invoice.memberId,
                        invoiceId: invoice.id,
                        type: NotificationType.LEMBRETE_VENCIMENTO,
                        channel: NotificationChannel.EMAIL, // Or based on settings
                        status: NotificationStatus.ENVIADA,
                        sentAt: new Date(),
                    }
                });
                generatedCount++;
            }
        }

        if (overdueEnabled) {
            const overdueInvoices = await prisma.invoice.findMany({
                where: {
                    vencimento: { lt: now },
                    status: InvoiceStatus.ATRASADA,
                    notifications: { none: { type: NotificationType.ALERTA_ATRASO } }
                }
            });

            for (const invoice of overdueInvoices) {
                await prisma.notification.create({
                     data: {
                        memberId: invoice.memberId,
                        invoiceId: invoice.id,
                        type: NotificationType.ALERTA_ATRASO,
                        channel: NotificationChannel.EMAIL,
                        status: NotificationStatus.ENVIADA,
                        sentAt: new Date(),
                    }
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
