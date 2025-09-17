import { Router } from 'express';
import db from '../db';

const router = Router();

// GET /api/notifications - Listar histórico de notificações
router.get('/', async (req, res) => {
    try {
        // const { rows } = await db.query('SELECT * FROM notifications ...');
        res.json([]); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar notificações.' });
    }
});

// POST /api/notifications/generate - Gerar notificações (stub)
router.post('/generate', async (req, res) => {
    // Lógica para encontrar faturas vencendo/vencidas e criar notificações
    console.log('Endpoint de geração de notificações chamado (stub).');
    res.json({ generatedCount: 0 });
});

// GET /api/portal/notifications/:studentId - Notificações para um aluno
router.get('/portal/notifications/:studentId', async (req, res) => {
    try {
        // const { rows } = await db.query('SELECT * FROM notifications WHERE "memberId" = $1', [req.params.studentId]);
        res.json([]); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar notificações do aluno.' });
    }
});

export default router;
