

import { Expense } from '../../types';

const API_URL = '/api';

export const getExpenses = async (): Promise<Expense[]> => {
    const response = await fetch(`${API_URL}/expenses`);
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch expenses');
    }
    return response.json();
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    const response = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to add expense');
    }
    return response.json();
};

export const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    const response = await fetch(`${API_URL}/expenses/${updatedExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExpense),
    });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to update expense');
    }
    return response.json();
};
