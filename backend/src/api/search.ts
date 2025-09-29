import { Router } from 'express';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase } from '../utils/mappers';

const router = Router();

// GET /api/search?q=...
router.get('/', async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Termo de busca é obrigatório.' });
    }

    try {
        const lowercasedQuery = `%${q.toLowerCase()}%`;
        
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('*')
            .ilike('nome', lowercasedQuery)
            .limit(5);

        if (membersError) throw membersError;
        
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('*, members!inner(nome)')
            .ilike('members.nome', lowercasedQuery)
            .limit(5);

        if (invoicesError) throw invoicesError;

        res.json({ 
            members: members.map(m => toCamelCase(m)), 
            invoices: invoices.map(i => toCamelCase(i)) 
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao realizar busca.' });
    }
});

export default router;