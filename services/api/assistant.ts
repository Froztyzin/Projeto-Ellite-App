

const API_URL = '/api';

export const getAiAssistantResponse = async (question: string): Promise<string> => {
    const response = await fetch(`${API_URL}/assistant/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to get response from AI assistant');
    }
    
    const data = await response.json();
    return data.response;
};
