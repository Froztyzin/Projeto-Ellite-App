import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import { db } from '../data';

const router = Router();

// GET /api/logs - Listar todos os logs de auditoria
router.get('/', authMiddleware, async (req, res) => {
    try {
        const logs = [...db.logs]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 200); // Limit to recent logs
            
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar logs.' });
    }
});

export default router;
