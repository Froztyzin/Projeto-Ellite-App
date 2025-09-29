import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { addLog } from '../utils/logging';
import { LogActionType, User } from '../types';
import authMiddleware from '../middleware/authMiddleware';
import { db } from '../data';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/users
router.get('/', authMiddleware, async (req, res) => {
    try {
        const usersToReturn = db.users.map(u => {
            const { password, ...user } = u;
            return user;
        });
        res.json(usersToReturn);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuários.' });
    }
});

// POST /api/users
router.post('/', authMiddleware, async (req: any, res) => {
    const { nome, email, role, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser: User = { 
            id: uuidv4(),
            nome, email, role,
            password: hashedPassword, 
            ativo: true 
        };
        db.users.push(newUser);
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userToReturn } = newUser;
        await addLog({ action: LogActionType.CREATE, details: `Novo usuário "${nome}" (${role}) criado.`, userName: req.user.name, userRole: req.user.role });
        res.status(201).json(userToReturn);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar usuário.' });
    }
});

// PUT /api/users/:id
router.put('/:id', authMiddleware, async (req: any, res) => {
    const { nome, email, role, password } = req.body;
    try {
        const userIndex = db.users.findIndex(u => u.id === req.params.id);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        
        const user = db.users[userIndex];
        user.nome = nome;
        user.email = email;
        user.role = role;

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }
        db.users[userIndex] = user;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userToReturn } = user;
        await addLog({ action: LogActionType.UPDATE, details: `Usuário "${nome}" atualizado.`, userName: req.user.name, userRole: req.user.role });
        res.json(userToReturn);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar usuário.' });
    }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', authMiddleware, async (req: any, res) => {
    try {
        const userIndex = db.users.findIndex(u => u.id === req.params.id);
        if (userIndex === -1) return res.status(404).json({ message: 'Usuário não encontrado.' });
        
        const user = db.users[userIndex];
        user.ativo = !user.ativo;
        db.users[userIndex] = user;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userToReturn } = user;
        await addLog({ action: LogActionType.UPDATE, details: `Status do usuário "${user.nome}" alterado para ${user.ativo ? 'ATIVO' : 'INATIVO'}.`, userName: req.user.name, userRole: req.user.role });
        res.json(userToReturn);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar status.' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, async (req: any, res) => {
    try {
        const userIndex = db.users.findIndex(u => u.id === req.params.id);
        if (userIndex === -1) return res.status(404).json({ message: 'Usuário não encontrado.' });
        
        const user = db.users[userIndex];
        db.users.splice(userIndex, 1);
        await addLog({ action: LogActionType.DELETE, details: `Usuário "${user.nome}" excluído.`, userName: req.user.name, userRole: req.user.role });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir usuário.' });
    }
});

export default router;
