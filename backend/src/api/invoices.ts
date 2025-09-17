import { Router } from 'express';
import prisma from '../lib/prisma';
import { addLog } from '../utils/logging';
import { LogActionType, InvoiceStatus, PaymentMethod, Role, EnrollmentStatus } from '../types';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// GET /api/invoices - Listar todas as faturas
router.get('/', authMiddleware, async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                member: { select: { id: true, nome: true, email: true, cpf: true } },
                payments: true,
            },
            orderBy: { vencimento: 'desc' }
        });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar faturas.' });
    }
});

// POST /api/invoices/generate-monthly - Gerar faturas para o próximo mês
router.post('/generate-monthly', authMiddleware, async (req: any, res) => {
    try {
        let generatedCount = 0;
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const year = nextMonth.getFullYear();
        const month = nextMonth.getMonth();
        const competencia = `${year}-${(month + 1).toString().padStart(2, '0')}`;

        const activeEnrollments = await prisma.enrollment.findMany({
            where: { status: EnrollmentStatus.ATIVA },
            include: { plan: true },
        });

        for (const enrollment of activeEnrollments) {
            const existingInvoice = await prisma.invoice.findFirst({
                where: { memberId: enrollment.memberId, competencia: competencia },
            });

            if (!existingInvoice) {
                await prisma.invoice.create({
                    data: {
                        memberId: enrollment.memberId,
                        competencia,
                        vencimento: new Date(year, month, enrollment.diaVencimento),
                        valor: enrollment.plan.precoBase,
                        status: InvoiceStatus.ABERTA,
                    }
                });
                generatedCount++;
            }
        }
        
        if (generatedCount > 0) {
            await addLog({ action: LogActionType.GENERATE, details: `${generatedCount} faturas geradas para a competência ${competencia}.`, userName: req.user.name, userRole: req.user.role });
        }

        res.json({ generatedCount });
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Erro ao gerar faturas.' });
    }
});

// POST /api/invoices/:invoiceId/payments - Registrar um pagamento
router.post('/:invoiceId/payments', authMiddleware, async (req: any, res) => {
    const { valor, data, metodo, notas } = req.body;
    const { invoiceId } = req.params;

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true },
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Fatura não encontrada.' });
        }

        await prisma.payment.create({
            data: { invoiceId, valor: parseFloat(valor), data: new Date(data), metodo, notas }
        });

        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.valor, 0) + parseFloat(valor);
        
        const newStatus = totalPaid >= invoice.valor ? InvoiceStatus.PAGA : InvoiceStatus.PARCIALMENTE_PAGA;

        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: newStatus },
            include: { member: true }
        });
        
        await addLog({ action: LogActionType.PAYMENT, details: `Pagamento de R$${valor} registrado para ${updatedInvoice.member.nome} na fatura ${invoice.competencia}.`, userName: req.user.name, userRole: req.user.role });

        res.json(updatedInvoice);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao registrar pagamento.' });
    }
});

// GET /api/invoices/:invoiceId/payment-link - Gerar um link de pagamento
router.get('/:invoiceId/payment-link', async (req, res) => {
    const { invoiceId } = req.params;
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return res.status(404).json({message: "Fatura não encontrada."});

    const mockLink = `https://pagamento.elitte.com/pay/${invoiceId}?value=${invoice.valor}`;
    res.json({ link: mockLink });
});

// POST /api/invoices/:invoiceId/pix - Gerar cobrança PIX
router.post('/:invoiceId/pix', async (req, res) => {
    const settings = await prisma.gymSettings.findFirst();
    if (!settings || !settings.pixKey) {
        return res.status(400).json({ message: 'Chave PIX não configurada.' });
    }
    res.json({
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${settings.pixKey}`,
        pixKey: settings.pixKey
    });
});

// POST /api/invoices/:invoiceId/pix/confirm - Confirmar pagamento PIX (simulação)
router.post('/:invoiceId/pix/confirm', async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.invoiceId },
            include: { payments: true, member: true },
        });

        if (!invoice) return res.status(404).json({ message: 'Fatura não encontrada' });
        
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.valor, 0);
        const remainingValue = invoice.valor - totalPaid;

        if (remainingValue > 0) {
            await prisma.payment.create({
                data: {
                    invoiceId: invoice.id,
                    valor: remainingValue,
                    data: new Date(),
                    metodo: PaymentMethod.PIX,
                    notas: 'Pagamento via Portal do Aluno'
                }
            });
        }

        const updatedInvoice = await prisma.invoice.update({
            where: { id: req.params.invoiceId },
            data: { status: InvoiceStatus.PAGA }
        });
        
        await addLog({ action: LogActionType.PAYMENT, details: `Pagamento PIX de R$${remainingValue.toFixed(2)} confirmado para ${invoice.member.nome}.`, userName: invoice.member.nome, userRole: Role.ALUNO });

        res.json(updatedInvoice);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao confirmar pagamento.' });
    }
});

export default router;
