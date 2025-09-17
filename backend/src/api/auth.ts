import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { LogActionType, Role } from '../types';
import { addLog } from '../utils/logging';

const router = Router();

// Rota de login para a equipe (admin, financeiro, etc.)
router.post('/login/staff', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        
        if (!user.ativo) {
            return res.status(403).json({ message: 'Este usuário está inativo.' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.nome },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '8h' }
        );
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user;

        await addLog({
            action: LogActionType.LOGIN,
            details: `Usuário ${user.nome} fez login com sucesso.`,
            userName: user.nome,
            userRole: user.role,
        });

        res.json({ token, user: userWithoutPassword });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Rota de login para alunos
router.post('/login/student', async (req: Request, res: Response) => {
    const { email, cpf } = req.body;
    
    if (!email || !cpf) {
        return res.status(400).json({ message: 'Email e CPF são obrigatórios.' });
    }

    try {
        const member = await prisma.member.findFirst({ 
            where: { email: email.toLowerCase(), cpf: cpf.replace(/\D/g, '') }
        });

        if (!member) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        
        if (!member.ativo) {
            return res.status(403).json({ message: 'Sua matrícula não está ativa.' });
        }

        const userPayload = { ...member, role: Role.ALUNO };

        const token = jwt.sign(
            { id: userPayload.id, role: userPayload.role, name: userPayload.nome },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '8h' }
        );
        
        await addLog({
            action: LogActionType.LOGIN,
            details: `Aluno ${member.nome} fez login no portal.`,
            userName: member.nome,
            userRole: Role.ALUNO,
        });

        res.json({ token, user: userPayload });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

export default router;