import { WorkoutPlan } from '../../types';
import apiClient from '../apiClient';

interface GeneratePlanParams {
    memberId: string;
    memberName: string;
    goal: string;
    experience: string;
    daysPerWeek: number;
    notes: string;
}

// Chama a IA para gerar um plano de treino (ainda não salvo)
export const generateWorkoutPlan = async (params: GeneratePlanParams): Promise<Omit<WorkoutPlan, 'id' | 'memberId' | 'createdAt'>> => {
    const { data } = await apiClient.post<Omit<WorkoutPlan, 'id' | 'memberId' | 'createdAt'>>('/api/workout-plans/generate', params);
    return data;
};

// Salva (cria ou atualiza) um plano de treino para um aluno
export const saveWorkoutPlan = async (planData: Partial<WorkoutPlan> & { memberId: string }): Promise<WorkoutPlan> => {
    const { data } = await apiClient.post<WorkoutPlan>('/api/workout-plans', planData);
    return data;
};

// Busca todos os planos de treino salvos
export const getWorkoutPlans = async (): Promise<WorkoutPlan[]> => {
    const { data } = await apiClient.get<WorkoutPlan[]>('/api/workout-plans');
    return data;
};

// Busca o plano de treino de um aluno específico
export const getWorkoutPlanForMember = async (memberId: string): Promise<WorkoutPlan | null> => {
    const { data } = await apiClient.get<WorkoutPlan | null>(`/api/workout-plans/member/${memberId}`);
    return data;
};