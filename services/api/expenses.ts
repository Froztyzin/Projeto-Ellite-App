import { Expense } from '../../types';
import apiClient from '../apiClient';

export const getExpenses = async (): Promise<Expense[]> => {
    const response = await apiClient.get('/expenses');
    return response.data;
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    const response = await apiClient.post('/expenses', expenseData);
    return response.data;
};

export const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    const response = await apiClient.put(`/expenses/${updatedExpense.id}`, updatedExpense);
    return response.data;
};
