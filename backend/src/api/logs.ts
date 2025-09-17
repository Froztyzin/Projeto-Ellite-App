import { Router } from 'express';
import prisma from '../lib/prisma';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// GET /api/logs - Listar todos os logs de auditoria
router.get('/', authMiddleware, async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 200 // Limit to recent logs to avoid performance issues
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar logs.' });
    }
});

export default router;
