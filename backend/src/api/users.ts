import { Router } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { addLog } from '../utils/logging';
import { LogActionType } from '../types';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// GET /api/users
router.get('/', authMiddleware, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, nome: true, email: true, role: true, ativo: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuários.' });
    }
});

// POST /api/users
router.post('/', authMiddleware, async (req: any, res) => {
    const { nome, email, role, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { nome, email, role, password: hashedPassword, ativo: true },
        });
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
        const dataToUpdate: any = { nome, email, role };
        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await prisma.user.update({
            where: { id: req.params.id },
            data: dataToUpdate,
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userToReturn } = updatedUser;
        await addLog({ action: LogActionType.UPDATE, details: `Usuário "${nome}" atualizado.`, userName: req.user.name, userRole: req.user.role });
        res.json(userToReturn);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar usuário.' });
    }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', authMiddleware, async (req: any, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
        
        const updatedUser = await prisma.user.update({
            where: { id: req.params.id },
            data: { ativo: !user.ativo },
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userToReturn } = updatedUser;
        await addLog({ action: LogActionType.UPDATE, details: `Status do usuário "${updatedUser.nome}" alterado para ${updatedUser.ativo ? 'ATIVO' : 'INATIVO'}.`, userName: req.user.name, userRole: req.user.role });
        res.json(userToReturn);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar status.' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, async (req: any, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
        
        await prisma.user.delete({ where: { id: req.params.id } });
        await addLog({ action: LogActionType.DELETE, details: `Usuário "${user.nome}" excluído.`, userName: req.user.name, userRole: req.user.role });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir usuário.' });
    }
});

export default router;
