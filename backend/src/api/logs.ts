import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase } from '../utils/mappers';

const router = Router();

// GET /api/logs - Listar todos os logs de auditoria
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(200);
            
        if (error) throw error;

        res.json(data.map(l => toCamelCase(l)));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar logs.' });
    }
});

export default router;