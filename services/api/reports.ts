import * as mockApi from '../mockApi';

export const getReportsData = async (periodInDays: number = 180) => {
    return mockApi.getReportsData(periodInDays);
};

export const getMonthlyPaymentsReportData = async (periodInDays: number) => {
    return mockApi.getMonthlyPaymentsReportData(periodInDays);
};

export const getReportSummary = async (reportData: any): Promise<string> => {
    return mockApi.getReportSummary(reportData);
};
