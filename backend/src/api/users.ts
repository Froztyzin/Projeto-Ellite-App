import { Router } from 'express';
import db from '../db';

const router = Router();

// GET /api/users - Listar todos os usuários
router.get('/', async (req, res) => {
    try {
        // const { rows } = await db.query('SELECT id, nome, email, role, ativo FROM users');
        res.json([]); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuários.' });
    }
});

// POST /api/users - Adicionar um novo usuário
router.post('/', async (req, res) => {
    const { nome, email, role, password } = req.body;
    try {
        // Lógica para hashear a senha com bcrypt e inserir no banco
        res.status(201).json({}); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar usuário.' });
    }
});

// PUT /api/users/:id - Atualizar um usuário
router.put('/:id', async (req, res) => {
    const { nome, email, role, password } = req.body;
    try {
        // Lógica para atualizar dados e, opcionalmente, a senha
        res.json({}); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar usuário.' });
    }
});

// PATCH /api/users/:id/status - Ativar/desativar um usuário
router.patch('/:id/status', async (req, res) => {
    try {
        // const { rows } = await db.query('UPDATE users SET ativo = NOT ativo WHERE id = $1 RETURNING id, nome, email, role, ativo', [req.params.id]);
        res.json({}); // Retorno mock
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar status.' });
    }
});

// DELETE /api/users/:id - Excluir um usuário
router.delete('/:id', async (req, res) => {
    try {
        // await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir usuário.' });
    }
});

export default router;
