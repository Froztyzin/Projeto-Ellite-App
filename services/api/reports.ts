import apiClient from '../apiClient';

export const getReportsData = async (periodInDays: number = 180) => {
    const { data } = await apiClient.get('/api/reports', { params: { periodInDays } });
    return data;
};

export const getMonthlyPaymentsReportData = async (periodInDays: number) => {
    const { data } = await apiClient.get('/api/reports/monthly-payments', { params: { periodInDays } });
    return data;
};

export const getReportSummary = async (reportData: any): Promise<string> => {
    const { data } = await apiClient.post<{ summary: string }>('/api/reports/summary', { reportData });
    return data.summary;
};