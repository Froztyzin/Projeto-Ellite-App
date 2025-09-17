import { Router } from 'express';
import db from '../db';

const router = Router();

// GET /api/logs - Listar todos os logs de auditoria
router.get('/', async (req, res) => {
    try {
        // const { rows } = await db.query('SELECT * FROM logs ORDER BY timestamp DESC');
        res.json([]); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar logs.' });
    }
});

export default router;
