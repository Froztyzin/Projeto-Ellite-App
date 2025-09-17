import { Router } from 'express';
import prisma from '../lib/prisma';
import { addLog } from '../utils/logging';
import { LogActionType } from '../types';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// GET /api/expenses - Listar todas as despesas
router.get('/', authMiddleware, async (req, res) => {
    try {
        const expenses = await prisma.expense.findMany({ orderBy: { data: 'desc' } });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar despesas.' });
    }
});

// POST /api/expenses - Adicionar nova despesa
router.post('/', authMiddleware, async (req: any, res) => {
    const { valor, ...rest } = req.body;
    try {
        const newExpense = await prisma.expense.create({
            data: { ...rest, valor: parseFloat(valor) },
        });
        await addLog({ action: LogActionType.CREATE, details: `Nova despesa "${newExpense.descricao}" de R$${newExpense.valor} registrada.`, userName: req.user.name, userRole: req.user.role });
        res.status(201).json(newExpense);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar despesa.' });
    }
});

// PUT /api/expenses/:id - Atualizar uma despesa
router.put('/:id', authMiddleware, async (req: any, res) => {
    const { id, valor, ...rest } = req.body;
    try {
        const updatedExpense = await prisma.expense.update({
            where: { id: req.params.id },
            data: { ...rest, valor: parseFloat(valor) },
        });
        await addLog({ action: LogActionType.UPDATE, details: `Despesa "${updatedExpense.descricao}" atualizada.`, userName: req.user.name, userRole: req.user.role });
        res.json(updatedExpense);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar despesa.' });
    }
});

export default router;
