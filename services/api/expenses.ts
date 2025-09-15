import { Expense, LogActionType } from '../../types';
import { supabase } from '../supabaseClient';
import { fromExpense, toExpense } from './mappers';
import { addLog } from './logs';

const formatCurrency = (value: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const getExpenses = async (): Promise<Expense[]> => {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('data', { ascending: false });

    if (error) throw new Error(error.message);
    return data.map(fromExpense);
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    const expenseModel = toExpense(expenseData);
    const { data, error } = await supabase
        .from('expenses')
        .insert(expenseModel)
        .select()
        .single();
    
    if (error) throw new Error(error.message);
    
    const newExpense = fromExpense(data);
    await addLog(LogActionType.CREATE, `Nova despesa "${newExpense.descricao}" de ${formatCurrency(newExpense.valor)} registrada.`);
    return newExpense;
};

export const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    const expenseModel = toExpense(updatedExpense);
    const { data, error } = await supabase
        .from('expenses')
        .update(expenseModel)
        .eq('id', updatedExpense.id)
        .select()
        .single();

    if (error) throw new Error(error.message);

    const result = fromExpense(data);
    await addLog(LogActionType.UPDATE, `Despesa "${result.descricao}" atualizada.`);
    return result;
};
