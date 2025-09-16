import { Plan, LogActionType } from '../../types';
import { supabase } from '../supabaseClient';
import { addLog } from './logs';

export const getPlans = async (): Promise<Plan[]> => {
    const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('precoBase', { ascending: true });

    if (error) {
        console.error("Error fetching plans:", error);
        throw new Error("Não foi possível buscar os planos.");
    }
    return data;
};

export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    const { data, error } = await supabase
        .from('plans')
        .insert({ ...planData, ativo: true })
        .select()
        .single();
    
    if (error) throw new Error("Não foi possível adicionar o plano.");

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
        
    if (error) throw new Error("Não foi possível atualizar o plano.");

    await addLog(LogActionType.UPDATE, `Plano "${data.nome}" atualizado.`);
    return data;
};

export const togglePlanStatus = async (planId: string): Promise<Plan> => {
    const { data: plan, error: fetchError } = await supabase.from('plans').select('ativo, nome').eq('id', planId).single();
    if (fetchError || !plan) throw new Error("Plano não encontrado.");

    const newStatus = !plan.ativo;
    const { data: updatedPlan, error: updateError } = await supabase
        .from('plans')
        .update({ ativo: newStatus })
        .eq('id', planId)
        .select()
        .single();
        
    if (updateError) throw new Error("Não foi possível alterar o status do plano.");

    await addLog(LogActionType.UPDATE, `Status do plano "${updatedPlan.nome}" alterado para ${newStatus ? 'ATIVO' : 'INATIVO'}.`);
    return updatedPlan;
};
