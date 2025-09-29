import { Invoice, PaymentMethod } from '../../types';
import * as mockApi from '../mockApi';

export const getInvoices = async (): Promise<Invoice[]> => {
    return mockApi.getInvoices();
};

export const generateMonthlyInvoices = async (): Promise<{ generatedCount: number }> => {
    return mockApi.generateMonthlyInvoices();
};

export const registerPayment = async (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    return mockApi.registerPayment(paymentData);
};

export const generatePixPayment = async (invoiceId: string): Promise<{ qrCode: string; pixKey: string }> => {
    return mockApi.generatePixPayment(invoiceId);
};

export const confirmPixPayment = async (invoiceId: string): Promise<Invoice> => {
    return mockApi.confirmPixPayment(invoiceId);
};

export const generatePaymentLink = async (invoiceId: string): Promise<{ link: string }> => {
    return mockApi.generatePaymentLink(invoiceId);
};
