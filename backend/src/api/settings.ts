import { Router } from 'express';
import prisma from '../lib/prisma';
import authMiddleware from '../middleware/authMiddleware';
import { addLog } from '../utils/logging';
import { LogActionType } from '../types';

const router = Router();

// Helper to ensure settings exist
const ensureSettings = async () => {
    const settings = await prisma.gymSettings.findFirst();
    if (!settings) {
        return await prisma.gymSettings.create({ data: {} });
    }
    return settings;
}

// GET /api/settings
router.get('/', authMiddleware, async (req, res) => {
    try {
        const settings = await ensureSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar configurações.' });
    }
});

// POST /api/settings
router.post('/', authMiddleware, async (req: any, res) => {
    const { id, updatedAt, ...newSettings } = req.body;
    try {
        const currentSettings = await ensureSettings();
        await prisma.gymSettings.update({
            where: { id: currentSettings.id },
            data: newSettings,
        });
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
