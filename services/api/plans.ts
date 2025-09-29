import { Plan } from '../../types';
import * as mockApi from '../mockApi';

export const getPlans = async (): Promise<Plan[]> => {
    return mockApi.getPlans();
};

export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    return mockApi.addPlan(planData);
};

export const updatePlan = async (updatedPlan: Plan): Promise<Plan> => {
    return mockApi.updatePlan(updatedPlan);
};

export const togglePlanStatus = async (planId: string): Promise<Plan> => {
    return mockApi.togglePlanStatus(planId);
};
