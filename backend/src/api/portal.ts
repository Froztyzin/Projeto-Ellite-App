import { Router } from 'express';
import prisma from '../lib/prisma';
import { addLog } from '../utils/logging';
import { LogActionType, Role } from '../types';

const router = Router();

// GET /api/portal/profile/:id
router.get('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const member = await prisma.member.findUnique({ where: { id } });

        if (!member) {
            return res.status(404).json({ message: 'Aluno não encontrado' });
        }
        
        const enrollment = await prisma.enrollment.findUnique({
            where: { memberId: id },
            include: { plan: true }
        });
        
        const invoices = await prisma.invoice.findMany({
            where: { memberId: id },
            include: { payments: true },
            orderBy: { vencimento: 'desc' }
        });

        res.json({
            member,
            enrollment,
            invoices,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao carregar dados do portal.' });
    }
});

// PUT /api/portal/profile/:id
router.put('/profile/:id', async (req, res) => {
    const { id } = req.params;
    const { email, telefone } = req.body;

    try {
        const updatedMember = await prisma.member.update({
            where: { id },
            data: { email, telefone }
        });

        await addLog({
            action: LogActionType.UPDATE,
            details: `Aluno ${updatedMember.nome} atualizou seu perfil no portal.`,
            userName: updatedMember.nome,
            userRole: Role.ALUNO
        });

        res.json(updatedMember);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
});


// GET /api/portal/notifications/:studentId
router.get('/notifications/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const notifications = await prisma.notification.findMany({
            where: { memberId: studentId },
            include: {
                invoice: { select: { competencia: true, id: true } }
            },
            orderBy: { sentAt: 'desc' }
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar notificações.' });
    }
});

export default router;
