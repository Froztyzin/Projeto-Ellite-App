import { Invoice, InvoiceStatus, EnrollmentStatus, PaymentMethod, Payment, LogActionType } from '../../types';
// Fix: Import the 'payments' array which is now correctly exported from the database module.
import { invoices, payments, enrollments, saveDatabase, simulateDelay, allMembers } from './database';
import { addLog } from './logs';
import { getSettings } from './settings';
import { faker } from '@faker-js/faker/locale/pt_BR';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const getInvoices = async (): Promise<Invoice[]> => {
    // Deep copy to prevent mutations from affecting the original data source
    const clonedInvoices = JSON.parse(JSON.stringify(invoices));
    return simulateDelay(clonedInvoices);
};

export const generateMonthlyInvoices = async (): Promise<{ generatedCount: number }> => {
    const today = new Date();
    const upcomingMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const targetYear = upcomingMonthDate.getFullYear();
    const targetMonth = upcomingMonthDate.getMonth();
    const competencia = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

    const activeEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.ATIVA);
    let generatedCount = 0;

    for (const enrollment of activeEnrollments) {
        const existingInvoice = invoices.find(i =>
            i.member.id === enrollment.member.id && i.competencia === competencia
        );

        if (!existingInvoice) {
            const newInvoice: Invoice = {
                id: faker.string.uuid(),
                member: enrollment.member,
                competencia,
                vencimento: new Date(targetYear, targetMonth, enrollment.diaVencimento),
                valor: enrollment.plan.precoBase,
                status: InvoiceStatus.ABERTA,
                payments: [],
            };
            invoices.push(newInvoice);
            generatedCount++;
        }
    }

    if (generatedCount > 0) {
        saveDatabase();
        await addLog(LogActionType.GENERATE, `${generatedCount} faturas para ${competencia} foram geradas.`);
    }
    
    return simulateDelay({ generatedCount });
};

export const registerPayment = async (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    const invoiceIndex = invoices.findIndex(i => i.id === paymentData.invoiceId);
    if (invoiceIndex === -1) throw new Error("Fatura não encontrada.");

    const newPayment: Payment = {
        id: faker.string.uuid(),
        invoiceId: paymentData.invoiceId,
        valor: paymentData.valor,
        data: paymentData.data,
        metodo: paymentData.metodo,
        notas: paymentData.notas,
    };
    payments.push(newPayment);
    
    const invoice = invoices[invoiceIndex];
    if (!invoice.payments) {
        invoice.payments = [];
    }
    invoice.payments.push(newPayment);

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.valor, 0);
    invoice.status = totalPaid >= invoice.valor ? InvoiceStatus.PAGA : InvoiceStatus.PARCIALMENTE_PAGA;
    
    invoices[invoiceIndex] = invoice;
    saveDatabase();
    
    const member = allMembers.find(m => m.id === invoice.member.id);
    await addLog(LogActionType.PAYMENT, `Pagamento de ${formatCurrency(paymentData.valor)} registrado para ${member?.nome}.`);
    
    return simulateDelay(invoice);
};

export const generatePixPayment = async (invoiceId: string): Promise<{ qrCode: string; pixKey: string }> => {
    const settings = await getSettings();
    const pixKey = settings.pixKey;
    if (!pixKey) throw new Error("Chave PIX não configurada pelo administrador.");

    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) throw new Error("Fatura não encontrada.");

    const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.valor, 0) || 0;
    const remainingAmount = (invoice.valor - totalPaid).toFixed(2);
    
    const pixPayload = `PIX_PAYLOAD_FOR_${invoiceId}_AMOUNT_${remainingAmount}_KEY_${pixKey}`;
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload)}`;
    
    return simulateDelay({ qrCode, pixKey: pixPayload });
};

export const confirmPixPayment = async (invoiceId: string): Promise<Invoice> => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) throw new Error("Fatura não encontrada.");
    if (invoice.status === InvoiceStatus.PAGA) return invoice;

    const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.valor, 0) || 0;
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
    const settings = await getSettings();
    if (!settings.pixKey) throw new Error("A geração de links de pagamento não está ativada. Peça ao administrador para configurar uma chave PIX.");
    return simulateDelay({ link: `https://elitte-corpus.com/pay/${invoiceId}` });
};