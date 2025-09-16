

import { Plan } from '../../types';

const API_URL = '/api';

export const getPlans = async (): Promise<Plan[]> => {
    const response = await fetch(`${API_URL}/plans`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch plans');
    }
    return response.json();
};

export const addPlan = async (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    const response = await fetch(`${API_URL}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to add plan');
    }
    return response.json();
};

export const updatePlan = async (updatedPlan: Plan): Promise<Plan> => {
    const response = await fetch(`${API_URL}/plans/${updatedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlan),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to update plan');
    }
    return response.json();
};

export const togglePlanStatus = async (planId: string): Promise<Plan> => {
    const response = await fetch(`${API_URL}/plans/${planId}/toggle-status`, { method: 'POST' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to toggle plan status');
    }
    return response.json();
};
