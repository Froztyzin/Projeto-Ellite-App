import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType, InvoiceStatus, PaymentMethod, Role, EnrollmentStatus } from '../types';
import authMiddleware from '../middleware/authMiddleware';
import { db } from '../data';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/invoices - Listar todas as faturas
router.get('/', authMiddleware, async (req, res) => {
    try {
        const invoicesWithDetails = db.invoices.map(invoice => {
            const member = db.members.find(m => m.id === invoice.memberId);
            const payments = db.payments.filter(p => p.invoiceId === invoice.id);
            if (!member) {
                // This case shouldn't happen with the mock data, but it's good practice
                // to handle it to avoid crashes. We'll skip this invoice.
                return null;
            }
            return {
                ...invoice,
                member, // Return the full member object
                payments: payments
            };
        }).filter((invoice): invoice is NonNullable<typeof invoice> => invoice !== null); // Type-safe filter

        res.json(invoicesWithDetails.sort((a,b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime()));
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

        const activeEnrollments = db.enrollments.filter(e => 
            e.status === EnrollmentStatus.ATIVA && new Date(e.fim) >= today
        );
        
        for (const enrollment of activeEnrollments) {
            const existingInvoice = db.invoices.find(i => 
                i.memberId === enrollment.memberId && i.competencia === competencia
            );

            if (!existingInvoice) {
                const plan = db.plans.find(p => p.id === enrollment.planId);
                if (plan) {
                    db.invoices.push({
                        id: uuidv4(),
                        memberId: enrollment.memberId,
                        competencia,
                        vencimento: new Date(year, month, enrollment.diaVencimento),
                        valor: plan.precoBase,
                        status: InvoiceStatus.ABERTA,
                    });
                    generatedCount++;
                }
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
        const invoiceIndex = db.invoices.findIndex(i => i.id === invoiceId);
        if (invoiceIndex === -1) {
            return res.status(404).json({ message: 'Fatura não encontrada.' });
        }
        const invoice = db.invoices[invoiceIndex];
        
        db.payments.push({
            id: uuidv4(),
            invoiceId,
            valor: parseFloat(valor),
            data: new Date(data),
            metodo,
            notas
        });

        const paymentsForInvoice = db.payments.filter(p => p.invoiceId === invoiceId);
        const totalPaid = paymentsForInvoice.reduce((sum, p) => sum + p.valor, 0);
        
        const newStatus = totalPaid >= invoice.valor ? InvoiceStatus.PAGA : InvoiceStatus.PARCIALMENTE_PAGA;
        
        invoice.status = newStatus;
        db.invoices[invoiceIndex] = invoice;
        
        const member = db.members.find(m => m.id === invoice.memberId);
        await addLog({ action: LogActionType.PAYMENT, details: `Pagamento de R$${valor} registrado para ${member?.nome} na fatura ${invoice.competencia}.`, userName: req.user.name, userRole: req.user.role });

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao registrar pagamento.' });
    }
});

// GET /api/invoices/:invoiceId/payment-link - Gerar um link de pagamento
router.get('/:invoiceId/payment-link', async (req, res) => {
    const { invoiceId } = req.params;
    const invoice = db.invoices.find(i => i.id === invoiceId);
    if (!invoice) return res.status(404).json({message: "Fatura não encontrada."});

    const mockLink = `https://pagamento.elitte.com/pay/${invoiceId}?value=${invoice.valor}`;
    res.json({ link: mockLink });
});

// POST /api/invoices/:invoiceId/pix - Gerar cobrança PIX
router.post('/:invoiceId/pix', async (req, res) => {
    const settings = db.settings;
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
        const invoiceIndex = db.invoices.findIndex(i => i.id === req.params.invoiceId);
        if (invoiceIndex === -1) return res.status(404).json({ message: 'Fatura não encontrada' });
        
        const invoice = db.invoices[invoiceIndex];
        const member = db.members.find(m => m.id === invoice.memberId);
        if (!member) return res.status(404).json({ message: 'Aluno não encontrado' });
        
        const paymentsForInvoice = db.payments.filter(p => p.invoiceId === invoice.id);
        const totalPaid = paymentsForInvoice.reduce((sum, p) => sum + p.valor, 0);
        const remainingValue = invoice.valor - totalPaid;

        if (remainingValue > 0) {
            db.payments.push({
                id: uuidv4(),
                invoiceId: invoice.id,
                valor: remainingValue,
                data: new Date(),
                metodo: PaymentMethod.PIX,
                notas: 'Pagamento via Portal do Aluno'
            });
        }

        invoice.status = InvoiceStatus.PAGA;
        db.invoices[invoiceIndex] = invoice;
        
        await addLog({ action: LogActionType.PAYMENT, details: `Pagamento PIX de R$${remainingValue.toFixed(2)} confirmado para ${member.nome}.`, userName: member.nome, userRole: Role.ALUNO });

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao confirmar pagamento.' });
    }
});

export default router;