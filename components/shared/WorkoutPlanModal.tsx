import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Member, WorkoutPlan, WorkoutDay } from '../../types';
import { generateWorkoutPlan, saveWorkoutPlan } from '../../services/api/workout';
import { FaTimes, FaBrain, FaSpinner, FaPlus, FaTrash } from 'react-icons/fa';
import { useToast } from '../../contexts/ToastContext';

interface WorkoutPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  existingPlan: WorkoutPlan | null;
}

const WorkoutPlanModal: React.FC<WorkoutPlanModalProps> = ({ isOpen, onClose, member, existingPlan }) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const [goal, setGoal] = useState('hypertrophy');
    const [experience, setExperience] = useState('intermediate');
    const [daysPerWeek, setDaysPerWeek] = useState('4');
    const [notes, setNotes] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState<Omit<WorkoutPlan, 'id' | 'memberId' | 'createdAt'> | null>(null);

    useEffect(() => {
        if (existingPlan) {
            setGoal(existingPlan.goal);
            setDaysPerWeek(String(existingPlan.daysPerWeek));
            setNotes(existingPlan.instructorNotes || '');
            setGeneratedPlan({
                planName: existingPlan.planName,
                goal: existingPlan.goal,
                daysPerWeek: existingPlan.daysPerWeek,
                planData: existingPlan.planData,
                instructorNotes: existingPlan.instructorNotes
            });
        } else {
            // Reset form when opening for a new plan
            setGoal('hypertrophy');
            setExperience('intermediate');
            setDaysPerWeek('4');
            setNotes('');
            setGeneratedPlan(null);
        }
    }, [existingPlan, isOpen]);

    const generationMutation = useMutation({
        mutationFn: generateWorkoutPlan,
        onSuccess: (data) => {
            setGeneratedPlan(data);
            addToast('Plano de treino gerado pela IA!', 'success');
        },
        onError: () => addToast('Erro ao gerar plano com IA. Tente novamente.', 'error'),
    });

    const saveMutation = useMutation({
        mutationFn: saveWorkoutPlan,
        onSuccess: () => {
            addToast('Plano de treino salvo com sucesso!', 'success');
            queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
            onClose();
        },
        onError: () => addToast('Erro ao salvar plano de treino.', 'error'),
    });

    const handleGenerate = () => {
        if (!member) return;
        generationMutation.mutate({
            memberId: member.id,
            memberName: member.nome,
            goal,
            experience,
            daysPerWeek: parseInt(daysPerWeek),
            notes,
        });
    };
    
    const handleSave = () => {
        if (!member || !generatedPlan) return;
        saveMutation.mutate({
            ...generatedPlan,
            id: existingPlan?.id, // Pass ID if editing
            memberId: member.id,
        });
    };
    
    const handleExerciseChange = (dayIndex: number, exIndex: number, field: string, value: string) => {
        if (!generatedPlan) return;
        const newPlanData = [...generatedPlan.planData];
        (newPlanData[dayIndex].exercises[exIndex] as any)[field] = value;
        setGeneratedPlan({ ...generatedPlan, planData: newPlanData });
    };
    
    const addExercise = (dayIndex: number) => {
        if(!generatedPlan) return;
        const newPlanData = [...generatedPlan.planData];
        newPlanData[dayIndex].exercises.push({ name: '', sets: '3', reps: '10', rest: '60s' });
        setGeneratedPlan({ ...generatedPlan, planData: newPlanData });
    };

    const removeExercise = (dayIndex: number, exIndex: number) => {
        if(!generatedPlan) return;
        const newPlanData = [...generatedPlan.planData];
        newPlanData[dayIndex].exercises.splice(exIndex, 1);
        setGeneratedPlan({ ...generatedPlan, planData: newPlanData });
    };


    if (!isOpen || !member) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-100">
                        {existingPlan ? 'Editar Plano de Treino' : 'Criar Novo Plano de Treino'} para <span className="text-primary-400">{member.nome}</span>
                    </h3>
                    <button onClick={onClose} className="text-slate-400 p-1.5 rounded-full hover:bg-slate-600"><FaTimes /></button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Form Panel */}
                    <div className="w-1/3 p-5 border-r border-slate-700 overflow-y-auto">
                        <h4 className="font-semibold text-lg text-slate-200 mb-4">Parâmetros</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Objetivo Principal</label>
                                <select value={goal} onChange={e => setGoal(e.target.value)} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md">
                                    <option value="hypertrophy">Hipertrofia Muscular</option>
                                    <option value="weight_loss">Perda de Peso</option>
                                    <option value="strength">Força</option>
                                    <option value="endurance">Resistência</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Nível de Experiência</label>
                                <select value={experience} onChange={e => setExperience(e.target.value)} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md">
                                    <option value="beginner">Iniciante</option>
                                    <option value="intermediate">Intermediário</option>
                                    <option value="advanced">Avançado</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-300">Dias por Semana</label>
                                <select value={daysPerWeek} onChange={e => setDaysPerWeek(e.target.value)} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md">
                                    <option value="2">2 dias</option>
                                    <option value="3">3 dias</option>
                                    <option value="4">4 dias</option>
                                    <option value="5">5 dias</option>
                                    <option value="6">6 dias</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-300">Observações (lesões, preferências)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md" placeholder="Ex: Lesão no ombro direito, evitar elevação lateral."/>
                            </div>
                            <button onClick={handleGenerate} disabled={generationMutation.isPending} className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 font-semibold transition disabled:bg-primary-800">
                                {generationMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaBrain />}
                                {generationMutation.isPending ? 'Gerando...' : 'Gerar com IA'}
                            </button>
                        </div>
                    </div>

                    {/* Plan Display Panel */}
                    <div className="w-2/3 p-5 overflow-y-auto">
                        <h4 className="font-semibold text-lg text-slate-200 mb-4">Plano Gerado</h4>
                        {generationMutation.isPending && (
                            <div className="text-center py-20">
                                <FaSpinner className="animate-spin text-4xl mx-auto text-primary-500"/>
                                <p className="mt-4 text-slate-400">A IA está montando o treino...</p>
                            </div>
                        )}
                        {generatedPlan ? (
                            <div className="space-y-4">
                                <input type="text" value={generatedPlan.planName} onChange={e => setGeneratedPlan(p => p ? {...p, planName: e.target.value} : null)} className="w-full text-xl font-bold bg-transparent text-primary-400 p-2 border-b-2 border-slate-700 focus:outline-none focus:border-primary-500" />
                                {generatedPlan.planData.map((day, dayIndex) => (
                                    <div key={dayIndex} className="bg-slate-900/50 p-4 rounded-lg">
                                        <h5 className="font-semibold text-slate-100 mb-3">{day.dayName}</h5>
                                        <div className="space-y-2 text-sm">
                                            {day.exercises.map((ex, exIndex) => (
                                                <div key={exIndex} className="grid grid-cols-12 gap-2 items-center">
                                                    <input value={ex.name} onChange={e => handleExerciseChange(dayIndex, exIndex, 'name', e.target.value)} className="col-span-5 p-1.5 bg-slate-700 rounded-md" placeholder="Exercício"/>
                                                    <input value={ex.sets} onChange={e => handleExerciseChange(dayIndex, exIndex, 'sets', e.target.value)} className="col-span-2 p-1.5 bg-slate-700 rounded-md" placeholder="Séries"/>
                                                    <input value={ex.reps} onChange={e => handleExerciseChange(dayIndex, exIndex, 'reps', e.target.value)} className="col-span-2 p-1.5 bg-slate-700 rounded-md" placeholder="Reps"/>
                                                    <input value={ex.rest} onChange={e => handleExerciseChange(dayIndex, exIndex, 'rest', e.target.value)} className="col-span-2 p-1.5 bg-slate-700 rounded-md" placeholder="Descanso"/>
                                                    <button onClick={() => removeExercise(dayIndex, exIndex)} className="text-red-500 hover:text-red-400 p-1"><FaTrash /></button>
                                                </div>
                                            ))}
                                             <button onClick={() => addExercise(dayIndex)} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 mt-2">
                                                <FaPlus /> Adicionar Exercício
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 py-20">
                                <p>Preencha os parâmetros e clique em "Gerar com IA" para criar um novo plano de treino.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-900/50 flex justify-end items-center gap-4 rounded-b-lg border-t border-slate-700">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={handleSave} disabled={!generatedPlan || saveMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-green-800 disabled:cursor-not-allowed">
                        {saveMutation.isPending ? <FaSpinner className="animate-spin" /> : 'Salvar Plano'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkoutPlanModal;
