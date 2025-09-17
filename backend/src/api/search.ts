import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/search?q=...
router.get('/', async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Termo de busca é obrigatório.' });
    }

    try {
        const lowercasedQuery = q.toLowerCase();
        
        const members = await prisma.member.findMany({
            where: {
                OR: [
                    { nome: { contains: lowercasedQuery, mode: 'insensitive' } },
                    { email: { contains: lowercasedQuery, mode: 'insensitive' } },
                ],
            },
            take: 5
        });

        const invoices = await prisma.invoice.findMany({
            where: {
                member: {
                    nome: { contains: lowercasedQuery, mode: 'insensitive' }
                }
            },
            include: {
                member: { select: { nome: true } }
            },
            take: 5
        });

        res.json({ members, invoices });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao realizar busca.' });
    }
});

export default router;
