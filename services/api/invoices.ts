import { Invoice, InvoiceStatus, EnrollmentStatus, PaymentMethod, Payment } from '../../types';
import { invoices, enrollments, addLog, formatCurrency, saveDatabase } from './database';
import { simulateDelay } from './database';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { getPaymentSettings } from './settings';
import { LogActionType } from '../../types';


export const getInvoices = () => simulateDelay(invoices);

export const generateMonthlyInvoices = (): Promise<{ generatedCount: number }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const today = new Date();
            // Calculate year and month for the UPCOMING month
            const upcomingMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            const targetYear = upcomingMonthDate.getFullYear();
            const targetMonth = upcomingMonthDate.getMonth(); // 0-indexed month

            const competencia = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
            let generatedCount = 0;

            const activeEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.ATIVA);

            activeEnrollments.forEach(enrollment => {
                const existingInvoice = invoices.find(inv => inv.member.id === enrollment.member.id && inv.competencia === competencia);
                if (!existingInvoice) {
                    const newInvoice: Invoice = {
                        id: faker.string.uuid(),
                        member: enrollment.member,
                        competencia,
                        vencimento: new Date(targetYear, targetMonth, enrollment.diaVencimento),
                        valor: enrollment.plan.precoBase,
                        status: InvoiceStatus.ABERTA,
                    };
                    invoices.unshift(newInvoice);
                    generatedCount++;
                }
            });
            
            if (generatedCount > 0) {
                addLog(LogActionType.GENERATE, `${generatedCount} faturas para o próximo mês (${competencia}) foram geradas.`);
            }

            invoices.sort((a,b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
            saveDatabase();
            resolve({ generatedCount });
        }, 1000);
    });
};

export const registerPayment = (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const invoiceIndex = invoices.findIndex(inv => inv.id === paymentData.invoiceId);
            if (invoiceIndex !== -1) {
                const invoice = invoices[invoiceIndex];
                if (!invoice.payments) {
                    invoice.payments = [];
                }

                const newPayment: Payment = {
                    id: faker.string.uuid(),
                    invoiceId: paymentData.invoiceId,
                    valor: paymentData.valor,
                    data: paymentData.data,
                    metodo: paymentData.metodo,
                    notas: paymentData.notas,
                };
                invoice.payments.push(newPayment);

                const totalPaid = invoice.payments.reduce((sum, p) => sum + p.valor, 0);

                if (totalPaid >= invoice.valor) {
                    invoice.status = InvoiceStatus.PAGA;
                } else if (totalPaid > 0) {
                    invoice.status = InvoiceStatus.PARCIALMENTE_PAGA;
                }

                invoices[invoiceIndex] = invoice;
                addLog(LogActionType.PAYMENT, `Pagamento de ${formatCurrency(newPayment.valor)} registrado para ${invoice.member.nome}.`);
                saveDatabase();
                resolve(JSON.parse(JSON.stringify(invoice)));
            } else {
                reject(new Error('Invoice not found'));
            }
        }, 500);
    });
};

// --- NEW FUNCTIONS FOR PIX PAYMENT ---

interface PixData {
    qrCode: string; // URL for a generated QR code image
    pixKey: string; // This is the "Copia e Cola" string
}

export const generatePixPayment = async (invoiceId: string): Promise<PixData> => {
    return new Promise(async (resolve, reject) => {
        // We add a delay inside the promise
        await new Promise(res => setTimeout(res, 800));

        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            return reject(new Error('Fatura não encontrada'));
        }

        const settings = await getPaymentSettings();
        const customPixKey = settings?.pixKey;

        let pixPayload = '';

        if (customPixKey) {
            // Simulate a more realistic BR Code payload including value and transaction ID
            const transactionId = faker.string.alphanumeric({ length: 25, casing: 'upper' });
            pixPayload = `00020126...${transactionId}...53039865404${invoice.valor.toFixed(2).replace('.',',')}5802BR...6304${customPixKey}`;
        } else {
            // Fallback to random data if no custom key is set
            pixPayload = faker.finance.iban();
        }
        
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload)}`;
        
        resolve({ qrCode, pixKey: pixPayload });
    });
};


export const confirmPixPayment = (invoiceId: string): Promise<Invoice> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
            if (invoiceIndex !== -1) {
                const invoice = invoices[invoiceIndex];

                // Don't add a new payment if it's already paid
                if (invoice.status === InvoiceStatus.PAGA) {
                    return resolve(JSON.parse(JSON.stringify(invoice)));
                }

                if (!invoice.payments) {
                    invoice.payments = [];
                }

                const totalPaid = invoice.payments.reduce((sum, p) => sum + p.valor, 0);
                const remainingAmount = invoice.valor - totalPaid;

                const newPayment: Payment = {
                    id: faker.string.uuid(),
                    invoiceId: invoiceId,
                    valor: remainingAmount, // Assume full remaining payment
                    data: new Date(),
                    metodo: PaymentMethod.PIX,
                    notas: 'Pagamento via Portal do Aluno',
                };
                invoice.payments.push(newPayment);
                invoice.status = InvoiceStatus.PAGA;

                invoices[invoiceIndex] = invoice;
                addLog(LogActionType.PAYMENT, `Pagamento PIX de ${formatCurrency(newPayment.valor)} confirmado para ${invoice.member.nome} via portal.`);
                saveDatabase();
                resolve(JSON.parse(JSON.stringify(invoice)));
            } else {
                reject(new Error('Fatura não encontrada para confirmação'));
            }
        }, 1200);
    });
};

// --- NEW FUNCTION for payment link ---
export const generatePaymentLink = (invoiceId: string): Promise<{ link: string }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const invoice = invoices.find(inv => inv.id === invoiceId);
            if (!invoice) {
                return reject(new Error('Fatura não encontrada'));
            }
            // Simulate a unique token for the payment link
            const token = faker.string.alphanumeric(32);
            const link = `https://pay.elittecorpus.com/?invoice_id=${invoiceId}&token=${token}`;
            resolve({ link });
        }, 600);
    });
};