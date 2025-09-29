import { Router } from 'express';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { addLog } from '../utils/logging';
import { LogActionType } from '../types';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '../utils/mappers';

const router = Router();

// GET /api/settings
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase.from('gym_settings').select('*').single();
        if (error) throw error;
        res.json(toCamelCase(data));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar configurações.' });
    }
});

// POST /api/settings
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const newSettings = req.body;
    try {
        const { data, error } = await supabase
            .from('gym_settings')
            .update(toSnakeCase(newSettings))
            .eq('id', 1) // Assuming there's only one row for settings
            .select();

        if (error) throw error;
        
        await addLog({
            action: LogActionType.UPDATE,
            details: 'Configurações gerais do sistema foram atualizadas.',
            userName: req.user!.name,
            userRole: req.user!.role,
        });
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar configurações.' });
    }
});

export default router;