import { Invoice, InvoiceStatus, EnrollmentStatus, PaymentMethod, Payment, LogActionType } from '../../types';
import { supabase } from '../supabaseClient';
import { addLog } from './logs';
import { getSettings } from './settings';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const getInvoices = async (): Promise<Invoice[]> => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*, members(id, nome, email), payments(*)');
        
    if (error) {
        console.error("Error fetching invoices:", error);
        throw new Error('Não foi possível buscar as faturas.');
    }

    // Map Supabase response to application's 'member' type
    return data.map(invoice => ({ ...invoice, member: invoice.members as any }));
};

export const generateMonthlyInvoices = async (): Promise<{ generatedCount: number }> => {
    const today = new Date();
    const upcomingMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const targetYear = upcomingMonthDate.getFullYear();
    const targetMonth = upcomingMonthDate.getMonth();
    const competencia = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

    // 1. Fetch all active enrollments with necessary related data
    const { data: activeEnrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('diaVencimento, members(id), plans(precoBase)')
        .eq('status', EnrollmentStatus.ATIVA);

    if (enrollmentsError) {
        console.error("Error fetching active enrollments:", enrollmentsError);
        throw new Error('Não foi possível buscar matrículas ativas.');
    }
    if (!activeEnrollments || activeEnrollments.length === 0) {
        return { generatedCount: 0 };
    }

    // 2. Get a list of member IDs from the active enrollments
    // Fix: Access the first element of the 'members' array from the Supabase relation.
    const memberIds = activeEnrollments.map(e => e.members[0].id);

    // 3. In a single query, find all invoices that already exist for these members in the target month
    const { data: existingInvoices, error: existingError } = await supabase
        .from('invoices')
        .select('member_id')
        .eq('competencia', competencia)
        .in('member_id', memberIds);

    if (existingError) {
        console.error("Error checking for existing invoices:", existingError);
        throw new Error('Falha ao verificar faturas existentes.');
    }

    // 4. Create a Set of member IDs that already have an invoice for efficient lookup
    const membersWithInvoice = new Set(existingInvoices.map(inv => inv.member_id));

    // 5. Filter out enrollments that already have an invoice and prepare the new invoices
    const invoicesToCreate = activeEnrollments
        // Fix: Access the first element of the 'members' array from the Supabase relation.
        .filter(enrollment => !membersWithInvoice.has(enrollment.members[0].id))
        .map(enrollment => ({
            // Fix: Access the first element of the 'members' array from the Supabase relation.
            member_id: enrollment.members[0].id,
            competencia,
            vencimento: new Date(targetYear, targetMonth, enrollment.diaVencimento).toISOString(),
            // Fix: Access the first element of the 'plans' array from the Supabase relation.
            valor: enrollment.plans[0].precoBase,
            status: InvoiceStatus.ABERTA,
        }));

    let generatedCount = 0;
    if (invoicesToCreate.length > 0) {
        const { error: insertError } = await supabase.from('invoices').insert(invoicesToCreate);
        if (insertError) {
            console.error("Error creating invoices:", insertError);
            throw new Error('Falha ao inserir novas faturas.');
        }
        generatedCount = invoicesToCreate.length;
    }

    if (generatedCount > 0) {
        await addLog(LogActionType.GENERATE, `${generatedCount} faturas para ${competencia} foram geradas.`);
    }
    
    return { generatedCount };
};

export const registerPayment = async (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    // 1. Insert the payment
    const { data: newPayment, error: paymentError } = await supabase
        .from('payments')
        .insert({
            invoice_id: paymentData.invoiceId,
            valor: paymentData.valor,
            data: paymentData.data,
            metodo: paymentData.metodo,
            notas: paymentData.notas,
        })
        .select()
        .single();
    
    if (paymentError) throw new Error("Falha ao registrar pagamento.");
    if (!newPayment) throw new Error("Falha ao criar registro de pagamento.");

    // 2. Get the invoice and all its payments to calculate the new status
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, members(id, nome), payments(valor)')
        .eq('id', paymentData.invoiceId)
        .single();

    if (invoiceError || !invoice) throw new Error("Fatura não encontrada após registrar pagamento.");
    
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.valor, 0);
    const newStatus = totalPaid >= invoice.valor ? InvoiceStatus.PAGA : InvoiceStatus.PARCIALMENTE_PAGA;

    // 3. Update the invoice status
    const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', paymentData.invoiceId)
        .select()
        .single();
    
    if (updateError) throw new Error("Falha ao atualizar status da fatura.");

    await addLog(LogActionType.PAYMENT, `Pagamento de ${formatCurrency(paymentData.valor)} registrado para ${invoice.members?.nome}.`);
    
    return { ...updatedInvoice, member: invoice.members as any };
};


export const generatePixPayment = async (invoiceId: string): Promise<{ qrCode: string; pixKey: string }> => {
    const { pixKey } = await getSettings();
    if (!pixKey) throw new Error("Chave PIX não configurada pelo administrador.");

    const { data: invoice } = await supabase.from('invoices').select('valor, payments(valor)').eq('id', invoiceId).single();
    if (!invoice) throw new Error("Fatura não encontrada.");

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.valor, 0);
    const remainingAmount = (invoice.valor - totalPaid).toFixed(2);
    
    // In a real implementation, this would call a payment gateway API to generate a real PIX charge.
    // For this simulation, we'll create a simple payload.
    const pixPayload = `PIX_PAYLOAD_FOR_${invoiceId}_AMOUNT_${remainingAmount}_KEY_${pixKey}`;
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload)}`;
    
    return { qrCode, pixKey: pixPayload };
};

export const confirmPixPayment = async (invoiceId: string): Promise<Invoice> => {
    // This is a mock confirmation. In a real scenario, this would be triggered by a webhook from the payment gateway.
    const { data: invoice } = await supabase
        .from('invoices')
        .select('valor, status, payments(valor)')
        .eq('id', invoiceId)
        .single();
    
    if (!invoice) throw new Error("Fatura não encontrada.");
    if (invoice.status === InvoiceStatus.PAGA) return invoice as any;

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.valor, 0);
    const remainingAmount = invoice.valor - totalPaid;

    return registerPayment({
        invoiceId: invoiceId,
        valor: remainingAmount,
        data: new Date(),
        metodo: PaymentMethod.PIX,
        notas: 'Pagamento via Portal do Aluno (PIX)',
    });
};

export const generatePaymentLink = async (invoiceId: string): Promise<{ link: string }> => {
    const { pixKey } = await getSettings();
    if (!pixKey) throw new Error("A geração de links de pagamento não está ativada. Peça ao administrador para configurar uma chave PIX.");
    // This would typically generate a unique link to a hosted payment page.
    return { link: `https://elitte-corpus.com/pay/${invoiceId}` };
};
