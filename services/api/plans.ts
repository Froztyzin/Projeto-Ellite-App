import { Plan, LogActionType } from '../../types';
import { plans, saveDatabase, simulateDelay } from './database';
import { addLog } from './logs';
import { faker } from '@faker-js/faker/locale/pt_BR';

export const getPlans = async (): Promise<Plan[]> => {
    const sortedPlans = [...plans].sort((a, b) => a.precoBase - b.precoBase);
    return simulateDelay(sortedPlans);
};

export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    const newPlan: Plan = {
        id: faker.string.uuid(),
        ...planData,
        ativo: true,
    };
    plans.push(newPlan);
    saveDatabase();
    await addLog(LogActionType.CREATE, `Novo plano "${newPlan.nome}" criado.`);
    return simulateDelay(newPlan);
};

export const updatePlan = async (updatedPlan: Plan): Promise<Plan> => {
    const index = plans.findIndex(p => p.id === updatedPlan.id);
    if (index === -1) throw new Error("Plano não encontrado.");
    
    plans[index] = updatedPlan;
    saveDatabase();
    await addLog(LogActionType.UPDATE, `Plano "${updatedPlan.nome}" atualizado.`);
    return simulateDelay(updatedPlan);
};

export const togglePlanStatus = async (planId: string): Promise<Plan> => {
    const index = plans.findIndex(p => p.id === planId);
    if (index === -1) throw new Error("Plano não encontrado.");

    const plan = plans[index];
    plan.ativo = !plan.ativo;
    plans[index] = plan;
    saveDatabase();

    await addLog(LogActionType.UPDATE, `Status do plano "${plan.nome}" alterado para ${plan.ativo ? 'ATIVO' : 'INATIVO'}.`);
    return simulateDelay(plan);
};