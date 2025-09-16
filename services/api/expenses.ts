import { Expense, LogActionType } from '../../types';
import { supabase } from '../supabaseClient';
import { addLog } from './logs';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const getExpenses = async (): Promise<Expense[]> => {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('data', { ascending: false });

    if (error) {
        console.error("Error fetching expenses: ", error);
        throw new Error('Não foi possível buscar as despesas.');
    }
    return data;
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();
    
    if (error) {
        console.error("Error adding expense: ", error);
        throw new Error('Não foi possível adicionar a despesa.');
    }

    await addLog(LogActionType.CREATE, `Nova despesa "${data.descricao}" de ${formatCurrency(data.valor)} registrada.`);
    return data;
};

export const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    const { data, error } = await supabase
        .from('expenses')
        .update(updatedExpense)
        .eq('id', updatedExpense.id)
        .select()
        .single();

    if (error) {
        console.error("Error updating expense: ", error);
        throw new Error('Não foi possível atualizar a despesa.');
    }
    
    await addLog(LogActionType.UPDATE, `Despesa "${data.descricao}" atualizada.`);
    return data;
};
