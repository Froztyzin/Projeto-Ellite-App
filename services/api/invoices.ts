import { Invoice, InvoiceStatus, EnrollmentStatus, PaymentMethod, Payment, Member } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { getPaymentSettings } from './settings';
import { LogActionType } from '../../types';
import { addLog } from './logs';
import { formatCurrency } from '../../lib/utils';
import { faker } from '@faker-js/faker/locale/pt_BR';

export const getInvoices = async (): Promise<Invoice[]> => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*, member:members(*), payments(*)')
        .order('vencimento', { ascending: false });

    if (error) throw error;
    return data as Invoice[];
};

export const generateMonthlyInvoices = async (): Promise<{ generatedCount: number }> => {
    const today = new Date();
    const upcomingMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const targetYear = upcomingMonthDate.getFullYear();
    const targetMonth = upcomingMonthDate.getMonth();
    const competencia = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    let generatedCount = 0;

    const { data: activeEnrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*, member:members(*), plan:plans(*)')
        .eq('status', EnrollmentStatus.ATIVA);

    if (enrollmentError) throw enrollmentError;

    for (const enrollment of activeEnrollments) {
        const { data: existingInvoice } = await supabase
            .from('invoices')
            .select('id')
            .eq('member_id', enrollment.member.id)
            .eq('competencia', competencia)
            .maybeSingle();

        if (!existingInvoice) {
            const newInvoice = {
                member_id: enrollment.member.id,
                competencia,
                vencimento: new Date(targetYear, targetMonth, enrollment.diaVencimento).toISOString(),
                valor: (enrollment.plan as any).precoBase,
                status: InvoiceStatus.ABERTA,
            };
            
            const { error: insertError } = await supabase.from('invoices').insert(newInvoice);
            if (insertError) {
                console.error("Error creating invoice for:", enrollment.member.nome, insertError);
            } else {
                generatedCount++;
            }
        }
    }
    
    if (generatedCount > 0) {
        await addLog(LogActionType.GENERATE, `${generatedCount} faturas para o próximo mês (${competencia}) foram geradas.`);
    }

    return { generatedCount };
};

export const registerPayment = async (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    const { data: newPayment, error: paymentError } = await supabase
        .from('payments')
        .insert({
            invoice_id: paymentData.invoiceId,
            valor: paymentData.valor,
            data: paymentData.data.toISOString(),
            metodo: paymentData.metodo,
            notas: paymentData.notas,
        })
        .select()
        .single();
    
    if (paymentError) throw paymentError;

    // Now, update the invoice status
    const { data: invoice } = await supabase
        .from('invoices')
        .select('valor, member:members(nome)')
        .eq('id', paymentData.invoiceId)
        .single();
    
    if (!invoice) throw new Error('Invoice not found after payment registration.');

    const { data: payments } = await supabase
        .from('payments')
        .select('valor')
        .eq('invoice_id', paymentData.invoiceId);
    
    const totalPaid = payments?.reduce((sum, p) => sum + p.valor, 0) || 0;
    let newStatus = invoice.status as InvoiceStatus;

    if (totalPaid >= invoice.valor) {
        newStatus = InvoiceStatus.PAGA;
    } else if (totalPaid > 0) {
        newStatus = InvoiceStatus.PARCIALMENTE_PAGA;
    }

    const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', paymentData.invoiceId)
        .select('*, member:members(*), payments(*)')
        .single();
    
    if (updateError) throw updateError;
    
    await addLog(LogActionType.PAYMENT, `Pagamento de ${formatCurrency(newPayment.valor)} registrado para ${invoice.member.nome}.`);

    return updatedInvoice as Invoice;
};


interface PixData {
    qrCode: string;
    pixKey: string;
}

export const generatePixPayment = async (invoiceId: string): Promise<PixData> => {
    await new Promise(res => setTimeout(res, 800)); // Simulate network latency

    const { data: invoice } = await supabase.from('invoices').select('valor').eq('id', invoiceId).single();
    if (!invoice) throw new Error('Fatura não encontrada');

    const settings = await getPaymentSettings();
    const customPixKey = settings?.pixKey;
    let pixPayload = customPixKey || faker.finance.iban();

    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload)}`;
    
    return { qrCode, pixKey: pixPayload };
};

export const confirmPixPayment = async (invoiceId: string): Promise<Invoice> => {
    const { data: invoice } = await supabase.from('invoices').select('valor, member_id, status, member:members(nome)').eq('id', invoiceId).single();
    if (!invoice) throw new Error('Fatura não encontrada para confirmação');
    if (invoice.status === InvoiceStatus.PAGA) return invoice as Invoice;

    const { data: payments } = await supabase.from('payments').select('valor').eq('invoice_id', invoiceId);
    const totalPaid = payments?.reduce((sum, p) => sum + p.valor, 0) || 0;
    const remainingAmount = invoice.valor - totalPaid;

    if (remainingAmount > 0) {
        await supabase.from('payments').insert({
            invoice_id: invoiceId,
            valor: remainingAmount,
            data: new Date().toISOString(),
            metodo: PaymentMethod.PIX,
            notas: 'Pagamento via Portal do Aluno',
        });
    }

    const { data: updatedInvoice, error } = await supabase
        .from('invoices')
        .update({ status: InvoiceStatus.PAGA })
        .eq('id', invoiceId)
        .select('*, member:members(*), payments(*)')
        .single();
    
    if (error) throw error;
    
    await addLog(LogActionType.PAYMENT, `Pagamento PIX de ${formatCurrency(remainingAmount)} confirmado para ${invoice.member.nome} via portal.`);
    
    return updatedInvoice as Invoice;
};

export const generatePaymentLink = (invoiceId: string): Promise<{ link: string }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const token = faker.string.alphanumeric(32);
            const link = `https://pay.elittecorpus.com/?invoice_id=${invoiceId}&token=${token}`;
            resolve({ link });
        }, 600);
    });
};