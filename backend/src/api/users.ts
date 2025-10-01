import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType, User, Role } from '../types';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase, toSnakeCase } from '../utils/mappers';

const router = Router();

// GET /api/users
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('id, nome, email, role, ativo').order('nome');
        if (error) throw error;
        res.json(data.map(u => toCamelCase(u)));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuários.' });
    }
});

// POST /api/users
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const { nome, email, role, password } = req.body;
    try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });
        if (authError) throw authError;

        const { data: user, error: userError } = await supabase
            .from('users')
            .insert({ id: authData.user.id, nome, email, role, ativo: true })
            .select('id, nome, email, role, ativo')
            .single();
        if (userError) throw userError;

        await addLog({ action: LogActionType.CREATE, details: `Novo usuário "${nome}" (${role}) criado.`, userName: req.user!.name, userRole: req.user!.role });
        res.status(201).json(toCamelCase(user));
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Erro ao adicionar usuário.' });
    }
});

// PUT /api/users/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const { nome, email, role, password } = req.body;
    const { id } = req.params;
    try {
        if (password) {
            const { error: authError } = await supabase.auth.admin.updateUserById(id, { password });
            if (authError) throw authError;
        }

        const { data, error } = await supabase
            .from('users')
            .update({ nome, email, role })
            .eq('id', id)
            .select('id, nome, email, role, ativo')
            .single();
        if (error) throw error;

        await addLog({ action: LogActionType.UPDATE, details: `Usuário "${nome}" atualizado.`, userName: req.user!.name, userRole: req.user!.role });
        res.json(toCamelCase(data));
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Erro ao atualizar usuário.' });
    }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { data: currentUser, error: fetchError } = await supabase.from('users').select('ativo, nome').eq('id', id).single();
        if (fetchError) throw fetchError;
        
        const newStatus = !currentUser.ativo;
        const { data, error } = await supabase.from('users').update({ ativo: newStatus }).eq('id', id).select('id, nome, email, role, ativo').single();
        if (error) throw error;

        await addLog({ action: LogActionType.UPDATE, details: `Status do usuário "${data.nome}" alterado para ${newStatus ? 'ATIVO' : 'INATIVO'}.`, userName: req.user!.name, userRole: req.user!.role });
        res.json(toCamelCase(data));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar status.' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const { id } = req.params;
    try {
        const { data: user, error: userError } = await supabase.from('users').select('nome').eq('id', id).single();
        if (userError) throw userError;

        const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
        if (deleteError) throw deleteError;

        await addLog({ action: LogActionType.DELETE, details: `Usuário "${user.nome}" excluído.`, userName: req.user!.name, userRole: req.user!.role });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Erro ao excluir usuário.' });
    }
});

export default router;