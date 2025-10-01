import { Invoice, PaymentMethod } from '../../types';
import apiClient from '../apiClient';

export const getInvoices = async (): Promise<Invoice[]> => {
    const response = await apiClient.get('invoices');
    return response.data;
};

export const generateMonthlyInvoices = async (): Promise<{ generatedCount: number }> => {
    const response = await apiClient.post('invoices/generate-monthly');
    return response.data;
};

export const registerPayment = async (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    const { invoiceId, ...rest } = paymentData;
    const response = await apiClient.post(`invoices/${invoiceId}/payments`, rest);
    return response.data;
};

export const generatePixPayment = async (invoiceId: string): Promise<{ qrCode: string; pixKey: string }> => {
    const response = await apiClient.post(`invoices/${invoiceId}/pix`);
    return response.data;
};

export const confirmPixPayment = async (invoiceId: string): Promise<Invoice> => {
    const response = await apiClient.post(`invoices/${invoiceId}/pix/confirm`);
    return response.data;
};

export const generatePaymentLink = async (invoiceId: string): Promise<{ link: string }> => {
    const response = await apiClient.get(`invoices/${invoiceId}/payment-link`);
    return response.data;
};