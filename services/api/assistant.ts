import apiClient from '../apiClient';

export const getAiAssistantResponse = async (question: string): Promise<string> => {
    const response = await apiClient.post<{ response: string }>('assistant', { question });
    return response.data.response;
};