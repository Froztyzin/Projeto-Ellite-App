import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType, WorkoutPlan } from '../types';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { generatePlanFromAI } from '../lib/geminiService';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '../utils/mappers';

const router = Router();

// POST /api/workout-plans/generate - Generate a plan using AI
router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const planData = await generatePlanFromAI(req.body);
        const fullPlan = {
            ...planData,
            goal: req.body.goal,
            daysPerWeek: req.body.daysPerWeek,
            instructorNotes: req.body.notes,
        };
        await addLog({
            action: LogActionType.GENERATE,
            details: `Plano de treino "${fullPlan.planName}" gerado com IA para ${req.body.memberName}.`,
            userName: req.user!.name,
            userRole: req.user!.role,
        });
        res.json(fullPlan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao gerar plano com IA.' });
    }
});

// GET /api/workout-plans - Get all plans
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase.from('workout_plans').select('*');
        if(error) throw error;
        res.json(data.map(p => toCamelCase(p)));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar planos de treino.' });
    }
});

// GET /api/workout-plans/member/:memberId - Get a member's plan
router.get('/member/:memberId', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase.from('workout_plans').select('*').eq('member_id', req.params.memberId).maybeSingle();
        if(error) throw error;
        res.json(data ? toCamelCase(data) : null);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar plano do aluno.' });
    }
});

// POST /api/workout-plans - Create or update a plan
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const { memberId, ...planData } = req.body;
    
    try {
        const { data, error } = await supabase
            .from('workout_plans')
            .upsert({
                member_id: memberId,
                ...toSnakeCase(planData)
            }, { onConflict: 'member_id' })
            .select()
            .single();

        if(error) throw error;
        
        const action = req.body.id ? LogActionType.UPDATE : LogActionType.CREATE;
        const details = `${action === LogActionType.CREATE ? 'Criado' : 'Atualizado'} plano de treino "${data.plan_name}" para o aluno.`;
        
        await addLog({
            action,
            details,
            userName: req.user!.name,
            userRole: req.user!.role,
        });

        res.status(200).json(toCamelCase(data));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao salvar o plano de treino.' });
    }
});


export default router;