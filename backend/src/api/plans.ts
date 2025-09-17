import { Router } from 'express';
import db from '../db';

const router = Router();

// GET /api/plans - Listar todos os planos
router.get('/', async (req, res) => {
    try {
        // const { rows } = await db.query('SELECT * FROM plans ORDER BY "precoBase" ASC');
        res.json([]); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar planos.' });
    }
});

// POST /api/plans - Adicionar um novo plano
router.post('/', async (req, res) => {
    const planData = req.body;
    try {
        // const { rows } = await db.query('INSERT INTO plans (nome, periodicidade, "precoBase", ativo) VALUES ($1, $2, $3, true) RETURNING *', [planData.nome, planData.periodicidade, planData.precoBase]);
        res.status(201).json({ ...planData, id: 'new-plan-id', ativo: true }); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar plano.' });
    }
});

// PUT /api/plans/:id - Atualizar um plano
router.put('/:id', async (req, res) => {
    const planData = req.body;
    try {
        // const { rows } = await db.query('UPDATE plans SET nome = $1, periodicidade = $2, "precoBase" = $3 WHERE id = $4 RETURNING *', [planData.nome, planData.periodicidade, planData.precoBase, req.params.id]);
        res.json({ ...planData, id: req.params.id }); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar plano.' });
    }
});

// PATCH /api/plans/:id/status - Ativar/desativar um plano
router.patch('/:id/status', async (req, res) => {
    try {
        // const { rows } = await db.query('UPDATE plans SET ativo = NOT ativo WHERE id = $1 RETURNING *', [req.params.id]);
        res.json({ id: req.params.id, ativo: true }); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar status do plano.' });
    }
});

export default router;
