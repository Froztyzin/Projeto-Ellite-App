import { Expense, LogActionType } from '../../types';
import { getDB, saveDatabase, addLog, simulateDelay } from './database';
import { faker } from '@faker-js/faker';

export const getExpenses = async (): Promise<Expense[]> => {
    const db = getDB();
    // Sort by most recent first
    const sortedExpenses = [...db.expenses].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return simulateDelay(sortedExpenses);
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    const db = getDB();
    const newExpense: Expense = {
        ...expenseData,
        id: faker.string.uuid(),
    };
    db.expenses.unshift(newExpense); // Add to the beginning
    addLog(LogActionType.CREATE, `Nova despesa registrada: ${newExpense.descricao} (${newExpense.valor})`);
    saveDatabase();
    return simulateDelay(newExpense);
};

export const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    const db = getDB();
    const expenseIndex = db.expenses.findIndex(e => e.id === updatedExpense.id);
    if (expenseIndex === -1) {
        throw new Error("Despesa não encontrada.");
    }
    db.expenses[expenseIndex] = updatedExpense;
    addLog(LogActionType.UPDATE, `Despesa "${updatedExpense.descricao}" atualizada.`);
    saveDatabase();
    return simulateDelay(updatedExpense);
};
