import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType } from '../types';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '../utils/mappers';

const router = Router();

// GET /api/expenses - Listar todas as despesas
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase.from('expenses').select('*').order('data', { ascending: false });
        if (error) throw error;
        res.json(data.map(e => toCamelCase(e)));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar despesas.' });
    }
});

// POST /api/expenses - Adicionar nova despesa
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const expenseData = req.body;
    try {
        const { data, error } = await supabase
            .from('expenses')
            .insert(toSnakeCase(expenseData))
            .select()
            .single();

        if (error) throw error;

        await addLog({ action: LogActionType.CREATE, details: `Nova despesa "${data.descricao}" de R$${data.valor} registrada.`, userName: req.user!.name, userRole: req.user!.role });
        res.status(201).json(toCamelCase(data));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar despesa.' });
    }
});

// PUT /api/expenses/:id - Atualizar uma despesa
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const expenseData = req.body;
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...updateData } = expenseData;
    try {
        const { data, error } = await supabase
            .from('expenses')
            .update(toSnakeCase(updateData))
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        
        await addLog({ action: LogActionType.UPDATE, details: `Despesa "${data.descricao}" atualizada.`, userName: req.user!.name, userRole: req.user!.role });
        res.json(toCamelCase(data));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar despesa.' });
    }
});

export default router;