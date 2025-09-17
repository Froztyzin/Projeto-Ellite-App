import { Invoice, PaymentMethod } from '../../types';
import apiClient from '../apiClient';

export const getInvoices = async (): Promise<Invoice[]> => {
    const { data } = await apiClient.get<Invoice[]>('/invoices');
    return data;
};

export const generateMonthlyInvoices = async (): Promise<{ generatedCount: number }> => {
    const { data } = await apiClient.post<{ generatedCount: number }>('/invoices/generate-monthly');
    return data;
};

export const registerPayment = async (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    const { data } = await apiClient.post<Invoice>(`/invoices/${paymentData.invoiceId}/payments`, paymentData);
    return data;
};

export const generatePixPayment = async (invoiceId: string): Promise<{ qrCode: string; pixKey: string }> => {
    const { data } = await apiClient.post<{ qrCode: string; pixKey: string }>(`/invoices/${invoiceId}/pix`);
    return data;
};

export const confirmPixPayment = async (invoiceId: string): Promise<Invoice> => {
    const { data } = await apiClient.post<Invoice>(`/invoices/${invoiceId}/pix/confirm`);
    return data;
};

export const generatePaymentLink = async (invoiceId: string): Promise<{ link: string }> => {
    const { data } = await apiClient.get<{ link: string }>(`/invoices/${invoiceId}/payment-link`);
    return data;
};
