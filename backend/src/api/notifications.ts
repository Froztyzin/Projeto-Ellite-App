import { Router } from 'express';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase } from '../utils/mappers';
import { addLog } from '../utils/logging';
import { LogActionType } from '../types';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*, members(nome), invoices(competencia)')
            .order('sent_at', { ascending: false });

        if (error) throw error;
        res.json(data.map(n => toCamelCase(n)));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar notificações.' });
    }
});

router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
    const { daysBeforeDue } = req.body;
    try {
        const { data, error } = await supabase.rpc('generate_notifications', { p_days_before_due: daysBeforeDue });
        if (error) throw error;

        const generatedCount = data || 0;
        if (generatedCount > 0) {
            await addLog({
                action: LogActionType.GENERATE,
                details: `${generatedCount} notificações geradas.`,
                userName: 'Sistema',
                userRole: req.user!.role
            });
        }
        res.json({ generatedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao gerar notificações' });
    }
});

export default router;