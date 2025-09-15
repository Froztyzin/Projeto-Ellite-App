import { Plan } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { LogActionType } from '../../types';
import { addLog } from './logs';

export const getPlans = async (): Promise<Plan[]> => {
    const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('precoBase', { ascending: true });
    
    if (error) throw error;
    return data;
};

export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    const { data, error } = await supabase
        .from('plans')
        .insert({ ...planData, ativo: true })
        .select()
        .single();

    if (error) throw error;
    await addLog(LogActionType.CREATE, `Novo plano "${data.nome}" criado.`);
    return data;
};

export const updatePlan = async (updatedPlan: Plan): Promise<Plan> => {
    const { data, error } = await supabase
        .from('plans')
        .update(updatedPlan)
        .eq('id', updatedPlan.id)
        .select()
        .single();
    
    if (error) throw error;
    await addLog(LogActionType.UPDATE, `Plano "${data.nome}" atualizado.`);
    return data;
};

export const togglePlanStatus = async (planId: string): Promise<Plan> => {
    const { data: currentPlan } = await supabase.from('plans').select('ativo, nome').eq('id', planId).single();
    if (!currentPlan) throw new Error('Plan not found');

    const newStatus = !currentPlan.ativo;
    const { data: updatedPlan, error } = await supabase
        .from('plans')
        .update({ ativo: newStatus })
        .eq('id', planId)
        .select()
        .single();

    if (error) throw error;
    await addLog(LogActionType.UPDATE, `Status do plano "${updatedPlan.nome}" alterado para ${newStatus ? 'ATIVO' : 'INATIVO'}.`);
    return updatedPlan;
};