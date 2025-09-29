import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType, Plan } from '../types';
import authMiddleware from '../middleware/authMiddleware';
import { db } from '../data';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/plans - Listar todos os planos
router.get('/', authMiddleware, async (req, res) => {
    try {
        const plans = [...db.plans].sort((a,b) => a.precoBase - b.precoBase);
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar planos.' });
    }
});

// POST /api/plans - Adicionar um novo plano
router.post('/', authMiddleware, async (req: any, res) => {
    const planData = req.body;
    try {
        const newPlan: Plan = {
            id: uuidv4(),
            ...planData,
            ativo: true,
        };
        db.plans.push(newPlan);
        await addLog({ action: LogActionType.CREATE, details: `Novo plano "${newPlan.nome}" criado.`, userName: req.user.name, userRole: req.user.role });
        res.status(201).json(newPlan);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar plano.' });
    }
});

// PUT /api/plans/:id - Atualizar um plano
router.put('/:id', authMiddleware, async (req: any, res) => {
    const planData = req.body;
    try {
        const planIndex = db.plans.findIndex(p => p.id === req.params.id);
        if (planIndex === -1) {
            return res.status(404).json({ message: 'Plano não encontrado.' });
        }
        const updatedPlan = { ...db.plans[planIndex], ...planData };
        db.plans[planIndex] = updatedPlan;

        await addLog({ action: LogActionType.UPDATE, details: `Plano "${updatedPlan.nome}" atualizado.`, userName: req.user.name, userRole: req.user.role });
        res.json(updatedPlan);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar plano.' });
    }
});

// PATCH /api/plans/:id/status - Ativar/desativar um plano
router.patch('/:id/status', authMiddleware, async (req: any, res) => {
    try {
        const planIndex = db.plans.findIndex(p => p.id === req.params.id);
        if (planIndex === -1) {
            return res.status(404).json({ message: 'Plano não encontrado.' });
        }
        const plan = db.plans[planIndex];
        const updatedPlan = { ...plan, ativo: !plan.ativo };
        db.plans[planIndex] = updatedPlan;

        await addLog({ action: LogActionType.UPDATE, details: `Status do plano "${updatedPlan.nome}" alterado para ${updatedPlan.ativo ? 'ATIVO' : 'INATIVO'}.`, userName: req.user.name, userRole: req.user.role });
        res.json(updatedPlan);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar status do plano.' });
    }
});

export default router;
