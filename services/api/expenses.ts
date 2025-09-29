import { Expense } from '../../types';
import * as mockApi from '../mockApi';

export const getExpenses = async (): Promise<Expense[]> => {
    return mockApi.getExpenses();
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    return mockApi.addExpense(expenseData);
};

export const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    return mockApi.updateExpense(updatedExpense);
};
