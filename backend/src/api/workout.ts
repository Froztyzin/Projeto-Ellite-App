import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType, Role, WorkoutPlan } from '../types';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { generatePlanFromAI } from '../lib/geminiService';
import { db } from '../data';
import { v4 as uuidv4 } from 'uuid';

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
        res.json(db.workoutPlans);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar planos de treino.' });
    }
});

// GET /api/workout-plans/member/:memberId - Get a member's plan
router.get('/member/:memberId', authMiddleware, async (req, res) => {
    try {
        const plan = db.workoutPlans.find(p => p.memberId === req.params.memberId);
        res.json(plan || null);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar plano do aluno.' });
    }
});

// POST /api/workout-plans - Create or update a plan
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const { id, memberId, planName, goal, daysPerWeek, planData, instructorNotes } = req.body;

    try {
        const existingPlanIndex = db.workoutPlans.findIndex(p => p.id === id || p.memberId === memberId);
        
        let savedPlan: WorkoutPlan;
        
        if (existingPlanIndex > -1) {
            // Update
            savedPlan = {
                ...db.workoutPlans[existingPlanIndex],
                planName, goal, daysPerWeek, planData, instructorNotes,
            };
            db.workoutPlans[existingPlanIndex] = savedPlan;
        } else {
            // Create
            savedPlan = {
                id: uuidv4(),
                createdAt: new Date(),
                memberId, planName, goal, daysPerWeek, planData, instructorNotes
            };
            db.workoutPlans.push(savedPlan);
        }
        
        const action = existingPlanIndex > -1 ? LogActionType.UPDATE : LogActionType.CREATE;
        const details = `${action === LogActionType.CREATE ? 'Criado' : 'Atualizado'} plano de treino "${savedPlan.planName}" para o aluno.`;
        
        await addLog({
            action,
            details,
            userName: req.user!.name,
            userRole: req.user!.role,
        });

        res.status(200).json(savedPlan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao salvar o plano de treino.' });
    }
});


export default router;
