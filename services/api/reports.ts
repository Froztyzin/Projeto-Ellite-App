import apiClient from '../apiClient';
import { GoogleGenerativeAI } from '@google/genai';

export const getReportsData = async (periodInDays: number = 180) => {
    const response = await apiClient.get('/reports', { params: { periodInDays } });
    return response.data;
};

export const getMonthlyPaymentsReportData = async (periodInDays: number) => {
    const response = await apiClient.get('/reports/monthly-payments', { params: { periodInDays } });
    return response.data;
};

export const getReportSummary = async (reportData: any): Promise<string> => {
    const response = await apiClient.post('/reports/summary', { reportData });
    return response.data.summary;
};
