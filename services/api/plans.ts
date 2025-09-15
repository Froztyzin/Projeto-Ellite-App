import { Plan, LogActionType } from '../../types';
import { supabase } from '../supabaseClient';
import { fromPlan, toPlan } from './mappers';
import { addLog } from './logs';

export const getPlans = async (): Promise<Plan[]> => {
    const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('preco_base', { ascending: true });
    
    if (error) throw new Error(error.message);
    return data.map(fromPlan);
};

export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    const planModel = toPlan({ ...planData, ativo: true });
    const { data, error } = await supabase
        .from('plans')
        .insert(planModel)
        .select()
        .single();
    
    if (error) throw new Error(error.message);

    const newPlan = fromPlan(data);
    await addLog(LogActionType.CREATE, `Novo plano "${newPlan.nome}" criado.`);
    return newPlan;
};

export const updatePlan = async (updatedPlan: Plan): Promise<Plan> => {
    const planModel = toPlan(updatedPlan);
    const { data, error } = await supabase
        .from('plans')
        .update(planModel)
        .eq('id', updatedPlan.id)
        .select()
        .single();
    
    if (error) throw new Error(error.message);

    const result = fromPlan(data);
    await addLog(LogActionType.UPDATE, `Plano "${result.nome}" atualizado.`);
    return result;
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

    if (error) throw new Error(error.message);

    const result = fromPlan(updatedPlan);
    await addLog(LogActionType.UPDATE, `Status do plano "${result.nome}" alterado para ${result.ativo ? 'ATIVO' : 'INATIVO'}.`);
    return result;
};
