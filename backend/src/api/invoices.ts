import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType, InvoiceStatus, Role, EnrollmentStatus } from '../types';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '../utils/mappers';

const router = Router();

// GET /api/invoices - Listar todas as faturas
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, members(id, nome, email), payments(*)')
            .order('vencimento', { ascending: false });
        
        if (error) throw error;

        res.json(data.map(i => toCamelCase(i)));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar faturas.' });
    }
});

// POST /api/invoices/generate-monthly - Gerar faturas para o próximo mês
router.post('/generate-monthly', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase.rpc('generate_monthly_invoices');
        if (error) throw error;

        const generatedCount = data || 0;
        if (generatedCount > 0) {
            await addLog({ action: LogActionType.GENERATE, details: `${generatedCount} faturas geradas para o próximo mês.`, userName: req.user!.name, userRole: req.user!.role });
        }
        res.json({ generatedCount });
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Erro ao gerar faturas.' });
    }
});

// POST /api/invoices/:invoiceId/payments - Registrar um pagamento
router.post('/:invoiceId/payments', authMiddleware, async (req: AuthRequest, res) => {
    const { valor, data, metodo, notas } = req.body;
    const { invoiceId } = req.params;

    try {
        const { data: newPayment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                invoice_id: invoiceId,
                valor: parseFloat(valor),
                data: new Date(data),
                metodo,
                notas,
            }).select().single();
        if (paymentError) throw paymentError;

        const { data: updatedInvoice, error: updateError } = await supabase.rpc('update_invoice_status', { p_invoice_id: invoiceId });
        if (updateError) throw updateError;
        
        const invoiceData = Array.isArray(updatedInvoice) ? updatedInvoice[0] : updatedInvoice;

        const { data: member } = await supabase.from('members').select('nome').eq('id', invoiceData.member_id).single();
        await addLog({ action: LogActionType.PAYMENT, details: `Pagamento de R$${valor} registrado para ${member?.nome} na fatura ${invoiceData.competencia}.`, userName: req.user!.name, userRole: req.user!.role });

        // Refetch full invoice to return to frontend
        const { data: fullInvoice, error: fetchError } = await supabase
            .from('invoices')
            .select('*, members(id, nome, email), payments(*)')
            .eq('id', invoiceId)
            .single();

        if (fetchError) throw fetchError;
        
        res.json(toCamelCase(fullInvoice));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao registrar pagamento.' });
    }
});


// GET /api/invoices/:invoiceId/payment-link - Gerar um link de pagamento (mock)
router.get('/:invoiceId/payment-link', async (req, res) => {
    const { invoiceId } = req.params;
    const { data: invoice, error } = await supabase.from('invoices').select('valor').eq('id', invoiceId).single();
    if (error || !invoice) return res.status(404).json({message: "Fatura não encontrada."});

    const mockLink = `https://pagamento.elitte.com/pay/${invoiceId}?value=${invoice.valor}`;
    res.json({ link: mockLink });
});

// POST /api/invoices/:invoiceId/pix - Gerar cobrança PIX
router.post('/:invoiceId/pix', async (req, res) => {
    const { data: settings, error } = await supabase.from('gym_settings').select('pix_key').single();
    if (error || !settings || !settings.pix_key) {
        return res.status(400).json({ message: 'Chave PIX não configurada.' });
    }
    res.json({
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${settings.pix_key}`,
        pixKey: settings.pix_key
    });
});

// POST /api/invoices/:invoiceId/pix/confirm - Confirmar pagamento PIX (simulação)
router.post('/:invoiceId/pix/confirm', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { data: invoice, error: invoiceError } = await supabase.from('invoices').select('*, payments(*)').eq('id', invoiceId).single();
        if (invoiceError || !invoice) return res.status(404).json({ message: 'Fatura não encontrada' });
        
        const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + p.valor, 0);
        const remainingValue = invoice.valor - totalPaid;

        if (remainingValue > 0) {
             const { error: paymentError } = await supabase.from('payments').insert({
                invoice_id: invoice.id,
                valor: remainingValue,
                data: new Date(),
                metodo: 'PIX',
                notas: 'Pagamento via Portal do Aluno'
            });
            if(paymentError) throw paymentError;
        }

        const { data: updatedInvoice, error: updateError } = await supabase.from('invoices').update({ status: InvoiceStatus.PAGA }).eq('id', invoiceId).select().single();
        if (updateError) throw updateError;
        
        const { data: member } = await supabase.from('members').select('nome').eq('id', updatedInvoice.member_id).single();
        await addLog({ action: LogActionType.PAYMENT, details: `Pagamento PIX de R$${remainingValue.toFixed(2)} confirmado para ${member?.nome}.`, userName: member?.nome || 'Aluno', userRole: Role.ALUNO });

        res.json(toCamelCase(updatedInvoice));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao confirmar pagamento.' });
    }
});

export default router;