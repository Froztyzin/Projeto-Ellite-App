import { Router } from 'express';
import db from '../db';

const router = Router();

// GET /api/expenses - Listar todas as despesas
router.get('/', async (req, res) => {
    try {
        // const { rows } = await db.query('SELECT * FROM expenses ORDER BY data DESC');
        res.json([]); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar despesas.' });
    }
});

// POST /api/expenses - Adicionar nova despesa
router.post('/', async (req, res) => {
    const expenseData = req.body;
    try {
        // const { rows } = await db.query('INSERT INTO expenses (...) VALUES (...) RETURNING *', [...]);
        res.status(201).json({ ...expenseData, id: 'new-expense-id' }); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar despesa.' });
    }
});

// PUT /api/expenses/:id - Atualizar uma despesa
router.put('/:id', async (req, res) => {
    const expenseData = req.body;
    try {
        // const { rows } = await db.query('UPDATE expenses SET ... WHERE id = $1 RETURNING *', [..., req.params.id]);
        res.json({ ...expenseData, id: req.params.id }); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar despesa.' });
    }
});

export default router;
