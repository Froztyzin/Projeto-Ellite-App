

const API_URL = '/api';

export const getReportsData = async (periodInDays: number = 180) => {
    const response = await fetch(`${API_URL}/reports/main?period=${periodInDays}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch reports data');
    }
    return response.json();
};

export const getMonthlyPaymentsReportData = async (periodInDays: number) => {
    const response = await fetch(`${API_URL}/reports/payments?period=${periodInDays}`);
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch monthly payments report data');
    }
    return response.json();
};

export const getReportSummary = async (reportData: any): Promise<string> => {
    const response = await fetch(`${API_URL}/reports/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to generate report summary');
    }
    const data = await response.json();
    return data.summary;
};
