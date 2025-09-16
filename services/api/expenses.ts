import { Expense, LogActionType } from '../../types';
import { expenses, saveDatabase, simulateDelay } from './database';
import { addLog } from './logs';
import { faker } from '@faker-js/faker/locale/pt_BR';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const getExpenses = async (): Promise<Expense[]> => {
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return simulateDelay(sortedExpenses);
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    const newExpense: Expense = {
        id: faker.string.uuid(),
        ...expenseData,
    };
    expenses.push(newExpense);
    saveDatabase();
    await addLog(LogActionType.CREATE, `Nova despesa "${newExpense.descricao}" de ${formatCurrency(newExpense.valor)} registrada.`);
    return simulateDelay(newExpense);
};

export const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    const index = expenses.findIndex(e => e.id === updatedExpense.id);
    if (index === -1) {
        throw new Error('Despesa não encontrada.');
    }
    expenses[index] = updatedExpense;
    saveDatabase();
    await addLog(LogActionType.UPDATE, `Despesa "${updatedExpense.descricao}" atualizada.`);
    return simulateDelay(updatedExpense);
};