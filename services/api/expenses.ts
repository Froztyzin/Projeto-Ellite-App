import { Expense } from '../../types';
import { expenses } from './database';
import { simulateDelay } from './database';
import { faker } from '@faker-js/faker/locale/pt_BR';

export const getExpenses = () => simulateDelay(expenses.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()));

export const addExpense = (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newExpense: Expense = {
                id: faker.string.uuid(),
                ...expenseData
            };
            expenses.unshift(newExpense);
            resolve(JSON.parse(JSON.stringify(newExpense)));
        }, 500);
    });
};

export const updateExpense = (updatedExpense: Expense): Promise<Expense> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = expenses.findIndex(e => e.id === updatedExpense.id);
            if (index !== -1) {
                expenses[index] = { ...expenses[index], ...updatedExpense };
                resolve(JSON.parse(JSON.stringify(expenses[index])));
            } else {
                reject(new Error('Expense not found'));
            }
        }, 500);
    });
};
