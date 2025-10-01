import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType, Role } from '../types';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase } from '../utils/mappers';

const router = Router();

// GET /api/portal/profile/:id
router.get('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: member, error: memberError } = await supabase.from('members').select('*').eq('id', id).single();
        if (memberError) return res.status(404).json({ message: 'Aluno não encontrado' });

        const { data: enrollment, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('*, plans(*)')
            .eq('member_id', id)
            .single();
        if(enrollmentError && enrollmentError.code !== 'PGRST116') throw enrollmentError;


        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('*, payments(*)')
            .eq('member_id', id)
            .order('vencimento', { ascending: false });
        if(invoicesError) throw invoicesError;


        res.json({
            member: toCamelCase(member),
            enrollment: enrollment ? toCamelCase(enrollment) : null,
            invoices: invoices ? invoices.map(i => toCamelCase(i)) : [],
            plan: enrollment ? toCamelCase(enrollment.plans) : null,
        });
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Erro ao carregar dados do portal.' });
    }
});

// PUT /api/portal/profile/:id
router.put('/profile/:id', async (req, res) => {
    const { id } = req.params;
    const { email, telefone } = req.body;

    try {
        const { data, error } = await supabase
            .from('members')
            .update({ email, telefone })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        
        await addLog({
            action: LogActionType.UPDATE,
            details: `Aluno ${data.nome} atualizou seu perfil no portal.`,
            userName: data.nome,
            userRole: Role.ALUNO
        });

        res.json(toCamelCase(data));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
});


// GET /api/portal/notifications/:studentId
router.get('/notifications/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*, invoices(id, competencia)')
            .eq('member_id', studentId)
            .order('sent_at', { ascending: false });

        if (error) throw error;
            
        res.json(data.map(n => toCamelCase(n)));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar notificações.' });
    }
});

export default router;