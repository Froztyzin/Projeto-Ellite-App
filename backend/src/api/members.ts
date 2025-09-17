import { Router } from 'express';
import prisma from '../lib/prisma';
import { addLog } from '../utils/logging';
import { LogActionType, EnrollmentStatus } from '../types';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// GET /api/members - Listar todos os membros com filtros
router.get('/', authMiddleware, async (req, res) => {
    const { query: searchQuery, status } = req.query;
    try {
        const where: any = {};
        if (status === 'ACTIVE') where.ativo = true;
        if (status === 'INACTIVE') where.ativo = false;

        if (searchQuery && typeof searchQuery === 'string') {
            const cleanedQuery = searchQuery.replace(/\D/g, ''); // For CPF search
            where.OR = [
                { nome: { contains: searchQuery, mode: 'insensitive' } },
                { cpf: { contains: cleanedQuery } },
            ];
        }

        const members = await prisma.member.findMany({
            where,
            orderBy: { nome: 'asc' }
        });

        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar membros.' });
    }
});

// GET /api/members/:id - Obter um membro por ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const member = await prisma.member.findUnique({ where: { id: req.params.id } });
        if (member) {
            res.json(member);
        } else {
            res.status(404).json({ message: 'Membro não encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar membro.' });
    }
});

// POST /api/members - Adicionar um novo membro
router.post('/', authMiddleware, async (req: any, res) => {
    const { memberData, planId } = req.body;
    try {
        const newMember = await prisma.member.create({
            data: { ...memberData, ativo: true },
        });

        if (planId) {
            await prisma.enrollment.create({
                data: {
                    memberId: newMember.id,
                    planId: planId,
                    inicio: new Date(),
                    fim: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Mock 1 month
                    status: EnrollmentStatus.ATIVA,
                    diaVencimento: new Date().getDate(),
                }
            });
        }
        await addLog({ action: LogActionType.CREATE, details: `Novo aluno "${newMember.nome}" criado.`, userName: req.user.name, userRole: req.user.role });
        res.status(201).json(newMember);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao adicionar membro.' });
    }
});

// PUT /api/members/:id - Atualizar um membro
router.put('/:id', authMiddleware, async (req: any, res) => {
    const { memberData } = req.body;
    try {
        const updatedMember = await prisma.member.update({
            where: { id: req.params.id },
            data: memberData,
        });
        await addLog({ action: LogActionType.UPDATE, details: `Dados do aluno "${updatedMember.nome}" atualizados.`, userName: req.user.name, userRole: req.user.role });
        res.json(updatedMember);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar membro.' });
    }
});

// PATCH /api/members/:id/status - Ativar/desativar um membro
router.patch('/:id/status', authMiddleware, async (req: any, res) => {
    try {
        const member = await prisma.member.findUnique({ where: { id: req.params.id } });
        if (!member) {
            return res.status(404).json({ message: 'Membro não encontrado.' });
        }
        const updatedMember = await prisma.member.update({
            where: { id: req.params.id },
            data: { ativo: !member.ativo },
        });
        await addLog({ action: LogActionType.UPDATE, details: `Status do aluno "${updatedMember.nome}" alterado para ${updatedMember.ativo ? 'ATIVO' : 'INATIVO'}.`, userName: req.user.name, userRole: req.user.role });
        res.json(updatedMember);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar status do membro.' });
    }
});

// DELETE /api/members/:id - Excluir um membro
router.delete('/:id', authMiddleware, async (req: any, res) => {
    try {
        const member = await prisma.member.findUnique({ where: { id: req.params.id } });
        if (!member) {
            return res.status(404).json({ message: 'Membro não encontrado.' });
        }
        await prisma.member.delete({ where: { id: req.params.id } });
        await addLog({ action: LogActionType.DELETE, details: `Aluno "${member.nome}" e todos os seus dados foram excluídos.`, userName: req.user.name, userRole: req.user.role });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir membro.' });
    }
});

// GET /api/members/:id/enrollment
router.get('/:id/enrollment', authMiddleware, async (req, res) => {
    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { memberId: req.params.id },
            include: { plan: true }
        });
        res.json(enrollment);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar matrícula.' });
    }
});

// GET /api/members/:id/invoices
router.get('/:id/invoices', authMiddleware, async (req, res) => {
    try {
        const memberInvoices = await prisma.invoice.findMany({
            where: { memberId: req.params.id },
            include: { payments: true },
            orderBy: { vencimento: 'desc' }
        });
        res.json(memberInvoices);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar faturas.' });
    }
});

export default router;
