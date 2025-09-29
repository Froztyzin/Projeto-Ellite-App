import { Plan } from '../../types';
import apiClient from '../apiClient';

export const getPlans = async (): Promise<Plan[]> => {
    const { data } = await apiClient.get<Plan[]>('/api/plans');
    return data;
};

export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    const { data } = await apiClient.post<Plan>('/api/plans', planData);
    return data;
};

export const updatePlan = async (updatedPlan: Plan): Promise<Plan> => {
    const { data } = await apiClient.put<Plan>(`/api/plans/${updatedPlan.id}`, updatedPlan);
    return data;
};

export const togglePlanStatus = async (planId: string): Promise<Plan> => {
    const { data } = await apiClient.patch<Plan>(`/api/plans/${planId}/status`);
    return data;
};