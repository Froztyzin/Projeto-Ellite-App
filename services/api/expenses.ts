import { Expense } from '../../types';
import { expenses, addLog, formatCurrency, saveDatabase } from './database';
import { simulateDelay } from './database';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { LogActionType } from '../../types';

export const getExpenses = () => simulateDelay(expenses.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()));

export const addExpense = (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newExpense: Expense = {
                id: faker.string.uuid(),
                ...expenseData
            };
            expenses.unshift(newExpense);
            addLog(LogActionType.CREATE, `Nova despesa "${newExpense.descricao}" de ${formatCurrency(newExpense.valor)} registrada.`);
            saveDatabase();
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
                addLog(LogActionType.UPDATE, `Despesa "${updatedExpense.descricao}" atualizada.`);
                saveDatabase();
                resolve(JSON.parse(JSON.stringify(expenses[index])));
            } else {
                reject(new Error('Expense not found'));
            }
        }, 500);
    });
};