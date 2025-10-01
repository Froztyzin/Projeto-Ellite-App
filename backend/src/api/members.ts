import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType, Role } from '../types';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '../utils/mappers';

const router = Router();

// GET /api/members - Listar todos os membros com filtros
router.get('/', authMiddleware, async (req, res) => {
    const { query: searchQuery, status } = req.query;
    try {
        let query = supabase.from('members').select('*');

        if (status === 'ACTIVE') query = query.eq('ativo', true);
        if (status === 'INACTIVE') query = query.eq('ativo', false);

        if (searchQuery && typeof searchQuery === 'string') {
            query = query.ilike('nome', `%${searchQuery}%`);
        }

        const { data, error } = await query.order('nome', { ascending: true });
        if (error) throw error;

        res.json(data.map(m => toCamelCase(m)));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar membros.' });
    }
});

// GET /api/members/:id - Obter um membro por ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase.from('members').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json(toCamelCase(data));
    } catch (error) {
        res.status(404).json({ message: 'Membro não encontrado.' });
    }
});

// POST /api/members - Adicionar um novo membro
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const { memberData, planId } = req.body;
    try {
        // Create user in Supabase Auth
        const password = `${memberData.cpf.slice(0, 6)}@${new Date().getFullYear()}`;
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: memberData.email,
            password: password,
            email_confirm: true,
        });
        if (authError) throw authError;

        const newMemberPayload = {
            id: authData.user.id,
            ...toSnakeCase(memberData),
            ativo: true,
        };
        delete newMemberPayload.password;

        const { data: member, error: memberError } = await supabase
            .from('members')
            .insert(newMemberPayload)
            .select()
            .single();

        if (memberError) throw memberError;

        if (planId) {
            await supabase.from('enrollments').insert({
                member_id: member.id,
                plan_id: planId,
                inicio: new Date(),
                fim: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Placeholder end
                status: 'ATIVA',
                dia_vencimento: new Date().getDate(),
            });
        }
        await addLog({ action: LogActionType.CREATE, details: `Novo aluno "${member.nome}" criado.`, userName: req.user!.name, userRole: req.user!.role });
        res.status(201).json(toCamelCase(member));
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Erro ao adicionar membro.' });
    }
});

// PUT /api/members/:id - Atualizar um membro
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const { memberData } = req.body;
    const { id: memberId } = req.params;
    try {
         // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeMemberData } = memberData;

        const { data, error } = await supabase
            .from('members')
            .update(toSnakeCase(safeMemberData))
            .eq('id', memberId)
            .select()
            .single();
        
        if (error) throw error;

        await addLog({ action: LogActionType.UPDATE, details: `Dados do aluno "${data.nome}" atualizados.`, userName: req.user!.name, userRole: req.user!.role });
        res.json(toCamelCase(data));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar membro.' });
    }
});

// PATCH /api/members/:id/status - Ativar/desativar um membro
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res) => {
    const { id } = req.params;
    try {
        const { data: currentMember, error: fetchError } = await supabase.from('members').select('ativo, nome').eq('id', id).single();
        if (fetchError) throw fetchError;
        
        const newStatus = !currentMember.ativo;
        const { data, error } = await supabase.from('members').update({ ativo: newStatus }).eq('id', id).select().single();
        if (error) throw error;

        await addLog({ action: LogActionType.UPDATE, details: `Status do aluno "${data.nome}" alterado para ${newStatus ? 'ATIVO' : 'INATIVO'}.`, userName: req.user!.name, userRole: req.user!.role });
        res.json(toCamelCase(data));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar status do membro.' });
    }
});

// DELETE /api/members/:id - Excluir um membro
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const { id } = req.params;
    try {
        const { data: member, error: memberError } = await supabase.from('members').select('nome').eq('id', id).single();
        if (memberError) throw memberError;

        const { error: deleteAuthUserError } = await supabase.auth.admin.deleteUser(id);
        if (deleteAuthUserError && deleteAuthUserError.message !== 'User not found') {
            throw deleteAuthUserError;
        }
        
        await addLog({ action: LogActionType.DELETE, details: `Aluno "${member.nome}" e todos os seus dados foram excluídos.`, userName: req.user!.name, userRole: req.user!.role });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir membro.' });
    }
});


// GET /api/members/:id/enrollment
router.get('/:id/enrollment', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('enrollments')
            .select('*, plans(*)')
            .eq('member_id', req.params.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        res.json(data ? toCamelCase(data) : null);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar matrícula.' });
    }
});

// GET /api/members/:id/invoices
router.get('/:id/invoices', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, payments(*)')
            .eq('member_id', req.params.id)
            .order('vencimento', { ascending: false });

        if (error) throw error;

        res.json(data.map(i => toCamelCase(i)));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar faturas.' });
    }
});

export default router;