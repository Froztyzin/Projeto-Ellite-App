import { Plan } from '../../types';
import { plans } from './database';
import { simulateDelay } from './database';
import { faker } from '@faker-js/faker/locale/pt_BR';

export const getPlans = () => simulateDelay(plans);

export const addPlan = (planData: Omit<Plan, 'id' | 'ativo'>): Promise<Plan> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newPlan: Plan = {
                id: faker.string.uuid(),
                ...planData,
                ativo: true,
            };
            plans.push(newPlan);
            resolve(JSON.parse(JSON.stringify(newPlan)));
        }, 500);
    });
};
export const updatePlan = (updatedPlan: Plan): Promise<Plan> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = plans.findIndex(p => p.id === updatedPlan.id);
            if (index !== -1) {
                plans[index] = { ...plans[index], ...updatedPlan };
                resolve(JSON.parse(JSON.stringify(plans[index])));
            } else {
                reject(new Error('Plan not found'));
            }
        }, 500);
    });
};
export const togglePlanStatus = (planId: string): Promise<Plan> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = plans.findIndex(p => p.id === planId);
            if (index !== -1) {
                plans[index].ativo = !plans[index].ativo;
                resolve(JSON.parse(JSON.stringify(plans[index])));
            } else {
                reject(new Error('Plan not found'));
            }
        }, 300);
    });
};
