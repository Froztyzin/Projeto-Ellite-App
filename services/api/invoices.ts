

import { Invoice, PaymentMethod } from '../../types';

const API_URL = '/api';

export const getInvoices = async (): Promise<Invoice[]> => {
    const response = await fetch(`${API_URL}/invoices`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch invoices');
    }
    return response.json();
};

export const generateMonthlyInvoices = async (): Promise<{ generatedCount: number }> => {
    const response = await fetch(`${API_URL}/invoices/generate`, { method: 'POST' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to generate monthly invoices');
    }
    return response.json();
};

export const registerPayment = async (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }): Promise<Invoice> => {
    const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to register payment');
    }
    return response.json();
};

export const generatePixPayment = async (invoiceId: string): Promise<{ qrCode: string; pixKey: string }> => {
    const response = await fetch(`${API_URL}/invoices/${invoiceId}/pix`, { method: 'POST' });
     if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate PIX payment');
    }
    return response.json();
};

export const confirmPixPayment = async (invoiceId: string): Promise<Invoice> => {
    const response = await fetch(`${API_URL}/invoices/${invoiceId}/pix/confirm`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to confirm PIX payment');
    return response.json();
};

export const generatePaymentLink = async (invoiceId: string): Promise<{ link: string }> => {
    const response = await fetch(`${API_URL}/invoices/${invoiceId}/payment-link`, { method: 'POST' });
     if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate payment link');
    }
    return response.json();
};
