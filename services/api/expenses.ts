import { Expense } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { LogActionType } from '../../types';
import { addLog } from './logs';
import { formatCurrency } from '../../lib/utils';


export const getExpenses = async (): Promise<Expense[]> => {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('data', { ascending: false });
    if (error) throw error;
    return data;
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();
    
    if (error) throw error;
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

    if (error) throw error;
    await addLog(LogActionType.UPDATE, `Despesa "${data.descricao}" atualizada.`);
    return data;
};