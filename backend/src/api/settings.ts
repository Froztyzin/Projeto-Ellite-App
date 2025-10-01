import { Router } from 'express';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { addLog } from '../utils/logging';
import { LogActionType } from '../types';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '../utils/mappers';

const router = Router();

// GET /api/settings
router.get('/', async (req, res) => {
    try {
        // Settings are public for login screen name, no auth middleware needed
        const { data, error } = await supabase.from('gym_settings').select('*').single();
        if (error) { 
            // If no settings exist, return a default
            if (error.code === 'PGRST116') {
                 return res.json({
                    gymName: "Elitte Corpus Academia",
                    pixKey: "",
                    remindersEnabled: true,
                    daysBeforeDue: 3,
                    overdueEnabled: true,
                });
            }
            throw error;
        }
        res.json(toCamelCase(data));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar configurações.' });
    }
});

// POST /api/settings
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const newSettings = req.body;
    try {
         // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...settingsData } = newSettings;
        const { data, error } = await supabase
            .from('gym_settings')
            .update(toSnakeCase(settingsData))
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