import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import { addLog } from '../utils/logging';
import { LogActionType } from '../types';
import { db } from '../data';

const router = Router();

// GET /api/settings
router.get('/', authMiddleware, async (req, res) => {
    try {
        res.json(db.settings);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar configurações.' });
    }
});

// POST /api/settings
router.post('/', authMiddleware, async (req: any, res) => {
    const newSettings = req.body;
    try {
        db.settings = { ...db.settings, ...newSettings };
        await addLog({
            action: LogActionType.UPDATE,
            details: 'Configurações gerais do sistema foram atualizadas.',
            userName: req.user.name,
            userRole: req.user.role,
        });
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar configurações.' });
    }
});

export default router;
