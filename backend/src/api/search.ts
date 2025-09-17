import { Router } from 'express';
import db from '../db';

const router = Router();

// GET /api/search?q=... - Busca global
router.get('/', async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Termo de busca é obrigatório.' });
    }

    try {
        // Lógica para buscar em paralelo em 'members' e 'invoices'
        // const memberResults = await db.query('SELECT * FROM members WHERE nome ILIKE $1', [`%${q}%`]);
        // const invoiceResults = await db.query('SELECT ...');

        res.json({
            members: [], // memberResults.rows,
            invoices: [] // invoiceResults.rows
        }); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao realizar busca.' });
    }
});

export default router;
