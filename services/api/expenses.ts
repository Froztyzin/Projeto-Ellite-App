import { Expense } from '../../types';
import apiClient from '../apiClient';

export const getExpenses = async (): Promise<Expense[]> => {
    const { data } = await apiClient.get<Expense[]>('/api/expenses');
    return data;
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    const { data } = await apiClient.post<Expense>('/api/expenses', expenseData);
    return data;
};

export const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    const { data } = await apiClient.put<Expense>(`/api/expenses/${updatedExpense.id}`, updatedExpense);
    return data;
};