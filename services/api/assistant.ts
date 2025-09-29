import apiClient from '../apiClient';

export const getAiAssistantResponse = async (question: string): Promise<string> => {
    const { data } = await apiClient.post<{ response: string }>('/api/assistant', { question });
    return data.response;
};