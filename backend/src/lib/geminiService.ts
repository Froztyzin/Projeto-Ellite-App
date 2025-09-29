import { WorkoutDay } from "../../../types";

interface GeneratePlanParams {
    memberName: string;
    goal: string;
    experience: string;
    daysPerWeek: number;
    notes: string;
}

export const generatePlanFromAI = async (params: GeneratePlanParams): Promise<{ planName: string; planData: WorkoutDay[] }> => {
    console.log("Mocking AI workout plan generation with params:", params);

    // Simulate network delay to mimic a real API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create a realistic mock response based on the input parameters
    const goalMap: { [key: string]: string } = {
        hypertrophy: 'Hipertrofia',
        weight_loss: 'Perda de Peso',
        strength: 'Força',
        endurance: 'Resistência'
    };

    const mockExercises = [
        { name: "Supino Reto com Barra", group: "peito" },
        { name: "Agachamento Livre", group: "pernas" },
        { name: "Remada Curvada", group: "costas" },
        { name: "Desenvolvimento Militar", group: "ombros" },
        { name: "Rosca Direta com Barra", group: "biceps" },
        { name: "Tríceps Pulley", group: "triceps" },
        { name: "Levantamento Terra", group: "costas" },
        { name: "Leg Press 45", group: "pernas" },
        { name: "Elevação Lateral", group: "ombros" },
        { name: "Puxada Frontal", group: "costas" },
    ];
    
    const planData = Array.from({ length: params.daysPerWeek }).map((_, i) => {
        const dayExercises = [];
        // Simple logic to add some variety
        for(let j=0; j<5; j++) {
            dayExercises.push(mockExercises[(i + j) % mockExercises.length]);
        }

        return {
            dayName: `Dia ${String.fromCharCode(65 + i)}: Treino Foco ${goalMap[params.goal]}`,
            exercises: dayExercises.map(ex => ({
                name: ex.name,
                sets: "3-4",
                reps: params.goal === 'strength' ? "4-6" : "8-12",
                rest: params.goal === 'strength' ? "90s" : "60s",
                observation: `Foco na execução correta para ${ex.group}.`
            }))
        };
    });

    const mockResponse = {
        planName: `Protocolo ${goalMap[params.goal]} para ${params.memberName.split(' ')[0]}`,
        planData
    };
    
    return mockResponse;
};
