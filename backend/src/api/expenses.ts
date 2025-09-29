import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType } from '../types';
import authMiddleware from '../middleware/authMiddleware';
import { db } from '../data';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/expenses - Listar todas as despesas
router.get('/', authMiddleware, async (req, res) => {
    try {
        const expenses = [...db.expenses].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar despesas.' });
    }
});

// POST /api/expenses - Adicionar nova despesa
router.post('/', authMiddleware, async (req: any, res) => {
    const { valor, ...rest } = req.body;
    try {
        const newExpense = {
            id: uuidv4(),
            ...rest,
            valor: parseFloat(valor),
        };
        db.expenses.push(newExpense);
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
        const expenseIndex = db.expenses.findIndex(e => e.id === req.params.id);
        if (expenseIndex === -1) {
            return res.status(404).json({ message: 'Despesa não encontrada.' });
        }
        const updatedExpense = {
            ...db.expenses[expenseIndex],
            ...rest,
            valor: parseFloat(valor)
        };
        db.expenses[expenseIndex] = updatedExpense;

        await addLog({ action: LogActionType.UPDATE, details: `Despesa "${updatedExpense.descricao}" atualizada.`, userName: req.user.name, userRole: req.user.role });
        res.json(updatedExpense);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar despesa.' });
    }
});

export default router;
