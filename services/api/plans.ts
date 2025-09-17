import { Plan, LogActionType } from '../../types';
import { getDB, saveDatabase, addLog, simulateDelay } from './database';
import { faker } from '@faker-js/faker';

export const getPlans = async (): Promise<Plan[]> => {
    const db = getDB();
    return simulateDelay([...db.plans].sort((a,b) => a.precoBase - b.precoBase));
};

export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    const db = getDB();
    const newPlan: Plan = {
        ...planData,
        id: faker.string.uuid(),
        ativo: true,
    };
    db.plans.push(newPlan);
    addLog(LogActionType.CREATE, `Novo plano criado: ${newPlan.nome}`);
    saveDatabase();
    return simulateDelay(newPlan);
};

export const updatePlan = async (updatedPlan: Plan): Promise<Plan> => {
    const db = getDB();
    const planIndex = db.plans.findIndex(p => p.id === updatedPlan.id);
    if (planIndex === -1) {
        throw new Error("Plano não encontrado.");
    }
    db.plans[planIndex] = updatedPlan;
    addLog(LogActionType.UPDATE, `Plano "${updatedPlan.nome}" atualizado.`);
    saveDatabase();
    return simulateDelay(updatedPlan);
};

export const togglePlanStatus = async (planId: string): Promise<Plan> => {
    const db = getDB();
    const plan = db.plans.find(p => p.id === planId);
    if (!plan) {
        throw new Error("Plano não encontrado.");
    }
    plan.ativo = !plan.ativo;
    addLog(LogActionType.UPDATE, `Status do plano ${plan.nome} alterado para ${plan.ativo ? 'ATIVO' : 'INATIVO'}.`);
    saveDatabase();
    return simulateDelay(plan);
};
