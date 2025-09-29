import * as mockApi from '../mockApi';

export const getAiAssistantResponse = async (question: string): Promise<string> => {
    return mockApi.getAiAssistantResponse(question);
};
