import { Invoice, InvoiceStatus, EnrollmentStatus, PaymentMethod, Payment, LogActionType } from '../../types';
import { supabase } from '../supabaseClient';
import { fromInvoice, fromEnrollment, toInvoice, toPayment } from './mappers';
import { addLog } from './logs';
import { getPaymentSettings } from './settings';
import { faker } from '@faker-js/faker/locale/pt_BR';

const formatCurrency = (value: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const getInvoices = async (): Promise<Invoice[]> => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*, members(*), payments(*)')
        .order('vencimento', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data.map(fromInvoice);
};

export const generateMonthlyInvoices = async (): Promise<{ generatedCount: number }> => {
    const today = new Date();
    const upcomingMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const targetYear = upcomingMonthDate.getFullYear();
    const targetMonth = upcomingMonthDate.getMonth();
    const competencia = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

    const { data: activeEnrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*, members(*), plans(*)')
        .eq('status', EnrollmentStatus.ATIVA);

    if (enrollmentsError) throw new Error(enrollmentsError.message);
    
    let generatedCount = 0;
    const newInvoices = [];

    for (const enrollmentData of activeEnrollments) {
        const enrollment = fromEnrollment(enrollmentData);
        
        const { count } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('member_id', enrollment.member.id)
            .eq('competencia', competencia);

        if (count === 0) {
            newInvoices.push({
                member_id: enrollment.member.id,
                competencia,
                vencimento: new Date(targetYear, targetMonth, enrollment.diaVencimento).toISOString(),
                valor: enrollment.plan.precoBase,
                status: InvoiceStatus.ABERTA,
            });
        }
    }

    if (newInvoices.length > 0) {
        const { error: insertError } = await supabase.from('invoices').insert(newInvoices);
        if (insertError) throw new Error(insertError.message);
        generatedCount = newInvoices.length;
        await addLog(LogActionType.GENERATE, `${generatedCount} faturas para o próximo mês (${competencia}) foram geradas.`);
    }

    return { generatedCount };
};

export const registerPayment = async (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    const { error: paymentError } = await supabase.from('payments').insert(toPayment(paymentData));
    if (paymentError) throw new Error(paymentError.message);

    const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('valor, members(nome), payments(valor)')
        .eq('id', paymentData.invoiceId)
        .single();
    
    if (invoiceError) throw new Error(invoiceError.message);

    const totalPaid = invoiceData.payments.reduce((sum: number, p: any) => sum + p.valor, 0);
    const newStatus = totalPaid >= invoiceData.valor ? InvoiceStatus.PAGA : InvoiceStatus.PARCIALMENTE_PAGA;

    const { data: updatedInvoiceData, error: updateError } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', paymentData.invoiceId)
        .select('*, members(*), payments(*)')
        .single();

    if (updateError) throw new Error(updateError.message);

    await addLog(LogActionType.PAYMENT, `Pagamento de ${formatCurrency(paymentData.valor)} registrado para ${invoiceData.members.nome}.`);
    
    return fromInvoice(updatedInvoiceData);
};

interface PixData {
    qrCode: string;
    pixKey: string;
}

export const generatePixPayment = async (invoiceId: string): Promise<PixData> => {
    const { data: invoice, error } = await supabase
        .from('invoices')
        .select('valor')
        .eq('id', invoiceId)
        .single();
    if (error) throw new Error(error.message);

    const settings = await getPaymentSettings();
    const customPixKey = settings?.pixKey;
    let pixPayload = customPixKey || faker.finance.iban();
    
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload)}`;
    return { qrCode, pixKey: pixPayload };
};

export const confirmPixPayment = async (invoiceId: string): Promise<Invoice> => {
    const { data: invoice, error } = await supabase
        .from('invoices')
        .select('valor, status, payments(valor), members(nome)')
        .eq('id', invoiceId)
        .single();

    if (error) throw new Error(error.message);
    if (invoice.status === InvoiceStatus.PAGA) {
        const { data: finalInvoice } = await supabase.from('invoices').select('*, members(*), payments(*)').eq('id', invoiceId).single();
        return fromInvoice(finalInvoice);
    }
    
    const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + p.valor, 0);
    const remainingAmount = invoice.valor - totalPaid;

    const paymentData = {
        invoiceId: invoiceId,
        valor: remainingAmount,
        data: new Date(),
        metodo: PaymentMethod.PIX,
        notas: 'Pagamento via Portal do Aluno',
    };

    return await registerPayment(paymentData);
};

export const generatePaymentLink = (invoiceId: string): Promise<{ link: string }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const token = faker.string.alphanumeric(32);
            const link = `https://pay.elittecorpus.com/?invoice_id=${invoiceId}&token=${token}`;
            resolve({ link });
        }, 300);
    });
};
