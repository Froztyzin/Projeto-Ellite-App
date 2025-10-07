import { Plan } from '../../types';
import apiClient from '../apiClient';


export const getPlans = async (): Promise<Plan[]> => {
    const response = await apiClient.get('/plans');
    return response.data;
};

export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    const response = await apiClient.post('/plans', planData);
    return response.data;
};

export const updatePlan = async (updatedPlan: Plan): Promise<Plan> => {
    const response = await apiClient.put(`/plans/${updatedPlan.id}`, updatedPlan);
    return response.data;
};

export const togglePlanStatus = async (planId: string): Promise<Plan> => {
    const response = await apiClient.patch(`/plans/${planId}/status`);
    return response.data;
};
