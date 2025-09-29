import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { getWorkoutPlanForMember } from '../../../services/api/workout';
import { WorkoutDay, ExerciseDetail } from '../../../types';
import { FaDumbbell, FaChevronDown, FaChevronUp, FaRegFolderOpen } from 'react-icons/fa';
import PageLoader from '../../shared/skeletons/PageLoader';
import EmptyState from '../../shared/EmptyState';

const ExerciseItem: React.FC<{ exercise: ExerciseDetail }> = ({ exercise }) => {
    return (
        <div className="grid grid-cols-3 gap-4 text-center py-3 border-b border-slate-700 last:border-b-0">
            <p className="col-span-3 text-left font-medium text-slate-100">{exercise.name}</p>
            <div>
                <p className="text-xs text-slate-400">Séries</p>
                <p className="font-semibold">{exercise.sets}</p>
            </div>
             <div>
                <p className="text-xs text-slate-400">Reps</p>
                <p className="font-semibold">{exercise.reps}</p>
            </div>
             <div>
                <p className="text-xs text-slate-400">Descanso</p>
                <p className="font-semibold">{exercise.rest || '-'}</p>
            </div>
        </div>
    );
};

const WorkoutDayCard: React.FC<{ day: WorkoutDay, index: number }> = ({ day, index }) => {
    const [isOpen, setIsOpen] = useState(index === 0); // Open the first day by default

    return (
        <div className="bg-card rounded-lg border border-slate-700 overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-left">
                <h3 className="text-lg font-bold text-primary-400">{day.dayName}</h3>
                {isOpen ? <FaChevronUp className="text-slate-400" /> : <FaChevronDown className="text-slate-400" />}
            </button>
            {isOpen && (
                <div className="px-4 pb-4">
                    <div className="space-y-2">
                        {day.exercises.map((ex, i) => (
                            <ExerciseItem key={i} exercise={ex} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StudentWorkout: React.FC = () => {
    const { user } = useAuth();

    const { data: workoutPlan, isLoading, error } = useQuery({
        queryKey: ['studentWorkoutPlan', user?.id],
        queryFn: () => {
            if (!user?.id) throw new Error("Usuário não encontrado");
            return getWorkoutPlanForMember(user.id);
        },
        enabled: !!user?.id,
    });
    
    if (isLoading) return <PageLoader />;

    if (error) {
        return <div className="text-red-400 text-center p-8 bg-card rounded-lg">Erro ao carregar seu plano de treino.</div>;
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                <FaDumbbell /> Meu Plano de Treino
            </h1>

            {workoutPlan ? (
                <div className="space-y-4">
                    <div className="bg-card p-4 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-semibold text-slate-100">{workoutPlan.planName}</h2>
                        <p className="text-slate-400">Objetivo: <span className="capitalize font-medium">{workoutPlan.goal.replace('_', ' ')}</span></p>
                        {workoutPlan.instructorNotes && (
                            <div className="mt-3 pt-3 border-t border-slate-600">
                                <h4 className="font-semibold text-slate-300">Observações do Instrutor:</h4>
                                <p className="text-sm text-slate-400 whitespace-pre-wrap">{workoutPlan.instructorNotes}</p>
                            </div>
                        )}
                    </div>
                    {workoutPlan.planData.map((day, index) => (
                        <WorkoutDayCard key={index} day={day} index={index} />
                    ))}
                </div>
            ) : (
                <div className="bg-card p-8 rounded-lg border border-slate-700">
                    <EmptyState
                        title="Nenhum plano de treino atribuído"
                        message="Peça ao seu instrutor para criar um plano de treino para você."
                        icon={<FaRegFolderOpen />}
                    />
                </div>
            )}
        </div>
    );
};

export default StudentWorkout;