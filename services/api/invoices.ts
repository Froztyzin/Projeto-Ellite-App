import { Invoice, PaymentMethod, LogActionType, InvoiceStatus } from '../../types';
import { getDB, saveDatabase, addLog, simulateDelay } from './database';
import { faker } from '@faker-js/faker';

export const getInvoices = async (): Promise<Invoice[]> => {
    const db = getDB();
    // Attach payments to invoices
    const invoicesWithPayments = db.invoices.map(invoice => ({
        ...invoice,
        payments: db.payments.filter(p => p.invoiceId === invoice.id)
    }));
    return simulateDelay(invoicesWithPayments);
};

export const generateMonthlyInvoices = async (): Promise<{ generatedCount: number }> => {
    // This is a complex operation, simplified for the mock API.
    // It should check active enrollments and create an invoice for the next month if it doesn't exist.
    addLog(LogActionType.GENERATE, 'Geração de faturas mensais iniciada (simulação).');
    // In this mock, we don't actually generate new ones to avoid flooding the DB on every click.
    return simulateDelay({ generatedCount: 0 });
};

export const registerPayment = async (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    const db = getDB();
    const invoiceIndex = db.invoices.findIndex(i => i.id === paymentData.invoiceId);
    if (invoiceIndex === -1) throw new Error("Fatura não encontrada.");

    const invoice = db.invoices[invoiceIndex];
    
    const newPayment = {
        id: faker.string.uuid(),
        ...paymentData
    };
    db.payments.push(newPayment);

    // Recalculate total paid amount directly from the source of truth
    const allPaymentsForInvoice = db.payments.filter(p => p.invoiceId === invoice.id);
    const totalPaid = allPaymentsForInvoice.reduce((sum, p) => sum + p.valor, 0);

    // Update invoice status based on the new total paid amount
    if (totalPaid >= invoice.valor) {
        invoice.status = InvoiceStatus.PAGA;
    } else {
        invoice.status = InvoiceStatus.PARCIALMENTE_PAGA;
    }
    
    // Add payment to invoice object for immediate consistency in return value
    invoice.payments = allPaymentsForInvoice;

    addLog(LogActionType.PAYMENT, `Pagamento de ${formatCurrency(paymentData.valor)} registrado para a fatura de ${invoice.member.nome}.`);
    saveDatabase();

    return simulateDelay(invoice);
};


export const generatePixPayment = async (invoiceId: string): Promise<{ qrCode: string; pixKey: string }> => {
    const pixKey = faker.finance.bitcoinAddress(); // Dummy key
    const qrCodeData = `00020126330014BR.GOV.BCB.PIX0111${pixKey}5204000053039865802BR5913NOME_EMPRESA6009SAO_PAULO62070503***6304E2D1`;
    // Using a placeholder image service for the QR code
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeData)}`;
    
    return simulateDelay({ qrCode, pixKey });
};

export const confirmPixPayment = async (invoiceId: string): Promise<Invoice> => {
    // This is a simulation. In a real scenario, a webhook would confirm payment.
    const db = getDB();
    const invoice = db.invoices.find(i => i.id === invoiceId);
    if (!invoice) throw new Error("Fatura não encontrada.");
    
    const allPaymentsForInvoice = db.payments.filter(p => p.invoiceId === invoice.id);
    const totalPaid = allPaymentsForInvoice.reduce((sum, p) => sum + p.valor, 0);
    const remainingValue = invoice.valor - totalPaid;

    if (remainingValue <= 0) {
        // If already paid, just return the current state
        return simulateDelay(invoice);
    }

    const paymentData = {
        invoiceId: invoice.id,
        valor: remainingValue,
        data: new Date(),
        metodo: PaymentMethod.PIX,
        notas: "Pagamento via PIX simulado."
    };
    return registerPayment(paymentData);
};


export const generatePaymentLink = async (invoiceId: string): Promise<{ link: string }> => {
    const db = getDB();
    const settings = db.settings;
    if(!settings || !settings.pixKey) {
        await simulateDelay({});
        throw new Error("Chave PIX não configurada nas Configurações.");
    }
    const link = `https://pagamento.elittecorpus.com/pay?id=${invoiceId}&key=${settings.pixKey}`;
    return simulateDelay({ link });
};

const formatCurrency = (value: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
