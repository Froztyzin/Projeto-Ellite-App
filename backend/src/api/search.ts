import { Router } from 'express';
import { db } from '../data';

const router = Router();

// GET /api/search?q=...
router.get('/', async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Termo de busca é obrigatório.' });
    }

    try {
        const lowercasedQuery = q.toLowerCase();
        
        const members = db.members
            .filter(m => 
                m.nome.toLowerCase().includes(lowercasedQuery) ||
                m.email.toLowerCase().includes(lowercasedQuery)
            )
            .slice(0, 5);

        const invoices = db.invoices
            .filter(i => {
                const member = db.members.find(m => m.id === i.memberId);
                return member?.nome.toLowerCase().includes(lowercasedQuery);
            })
            .map(i => {
                const member = db.members.find(m => m.id === i.memberId);
                return {...i, member: { nome: member?.nome || '' }};
            })
            .slice(0, 5);

        res.json({ members, invoices });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao realizar busca.' });
    }
});

export default router;
