import { Plan } from '../../types';
import apiClient from '../apiClient';

export const getPlans = async (): Promise<Plan[]> => {
    const { data } = await apiClient.get<Plan[]>('/plans');
    return data;
};

export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    const { data } = await apiClient.post<Plan>('/plans', planData);
    return data;
};

export const updatePlan = async (updatedPlan: Plan): Promise<Plan> => {
    const { data } = await apiClient.put<Plan>(`/plans/${updatedPlan.id}`, updatedPlan);
    return data;
};

export const togglePlanStatus = async (planId: string): Promise<Plan> => {
    const { data } = await apiClient.patch<Plan>(`/plans/${planId}/status`);
    return data;
};
