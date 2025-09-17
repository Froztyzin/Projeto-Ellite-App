import { Router } from 'express';
import prisma from '../lib/prisma';
import { addLog } from '../utils/logging';
import { LogActionType } from '../types';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// GET /api/plans - Listar todos os planos
router.get('/', authMiddleware, async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({ orderBy: { precoBase: 'asc' } });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar planos.' });
    }
});

// POST /api/plans - Adicionar um novo plano
router.post('/', authMiddleware, async (req: any, res) => {
    const planData = req.body;
    try {
        const newPlan = await prisma.plan.create({
            data: { ...planData, ativo: true },
        });
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
        const updatedPlan = await prisma.plan.update({
            where: { id: req.params.id },
            data: planData,
        });
        await addLog({ action: LogActionType.UPDATE, details: `Plano "${updatedPlan.nome}" atualizado.`, userName: req.user.name, userRole: req.user.role });
        res.json(updatedPlan);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar plano.' });
    }
});

// PATCH /api/plans/:id/status - Ativar/desativar um plano
router.patch('/:id/status', authMiddleware, async (req: any, res) => {
    try {
        const plan = await prisma.plan.findUnique({ where: { id: req.params.id } });
        if (!plan) {
            return res.status(404).json({ message: 'Plano não encontrado.' });
        }
        const updatedPlan = await prisma.plan.update({
            where: { id: req.params.id },
            data: { ativo: !plan.ativo },
        });
        await addLog({ action: LogActionType.UPDATE, details: `Status do plano "${updatedPlan.nome}" alterado para ${updatedPlan.ativo ? 'ATIVO' : 'INATIVO'}.`, userName: req.user.name, userRole: req.user.role });
        res.json(updatedPlan);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar status do plano.' });
    }
});

export default router;
