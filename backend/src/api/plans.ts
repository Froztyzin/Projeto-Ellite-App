import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType, Plan } from '../types';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '../utils/mappers';

const router = Router();

// GET /api/plans - Listar todos os planos
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase.from('plans').select('*').order('preco_base', { ascending: true });
        if (error) throw error;
        res.json(data.map(p => toCamelCase(p)));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar planos.' });
    }
});

// POST /api/plans - Adicionar um novo plano
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const planData = req.body;
    try {
        const { data, error } = await supabase
            .from('plans')
            .insert({ ...toSnakeCase(planData), ativo: true })
            .select()
            .single();
        if (error) throw error;
        
        await addLog({ action: LogActionType.CREATE, details: `Novo plano "${data.nome}" criado.`, userName: req.user!.name, userRole: req.user!.role });
        res.status(201).json(toCamelCase(data));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar plano.' });
    }
});

// PUT /api/plans/:id - Atualizar um plano
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const planData = req.body;
    try {
        const { data, error } = await supabase
            .from('plans')
            .update(toSnakeCase(planData))
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        await addLog({ action: LogActionType.UPDATE, details: `Plano "${data.nome}" atualizado.`, userName: req.user!.name, userRole: req.user!.role });
        res.json(toCamelCase(data));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar plano.' });
    }
});

// PATCH /api/plans/:id/status - Ativar/desativar um plano
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data: currentPlan, error: fetchError } = await supabase.from('plans').select('ativo').eq('id', req.params.id).single();
        if (fetchError) throw fetchError;

        const newStatus = !currentPlan.ativo;
        const { data, error } = await supabase
            .from('plans')
            .update({ ativo: newStatus })
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;

        await addLog({ action: LogActionType.UPDATE, details: `Status do plano "${data.nome}" alterado para ${newStatus ? 'ATIVO' : 'INATIVO'}.`, userName: req.user!.name, userRole: req.user!.role });
        res.json(toCamelCase(data));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar status do plano.' });
    }
});

export default router;