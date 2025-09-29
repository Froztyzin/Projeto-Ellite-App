import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType, EnrollmentStatus, PlanPeriodicity } from '../types';
import authMiddleware from '../middleware/authMiddleware';
import { db } from '../data';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/members - Listar todos os membros com filtros
router.get('/', authMiddleware, async (req, res) => {
    const { query: searchQuery, status } = req.query;
    try {
        let members = [...db.members];
        if (status === 'ACTIVE') members = members.filter(m => m.ativo);
        if (status === 'INACTIVE') members = members.filter(m => !m.ativo);

        if (searchQuery && typeof searchQuery === 'string') {
            const cleanedQuery = searchQuery.replace(/\D/g, ''); // For CPF search
            const lowerQuery = searchQuery.toLowerCase();
            members = members.filter(m => 
                m.nome.toLowerCase().includes(lowerQuery) ||
                m.cpf.includes(cleanedQuery)
            );
        }

        res.json(members.sort((a,b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar membros.' });
    }
});

// GET /api/members/:id - Obter um membro por ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const member = db.members.find(m => m.id === req.params.id);
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
        const newMember = { 
            id: uuidv4(),
            ...memberData,
            ativo: true 
        };
        db.members.push(newMember);

        if (planId) {
            const plan = db.plans.find(p => p.id === planId);
            if (plan) {
                const startDate = new Date();
                const endDate = new Date(startDate);
                if (plan.periodicidade === PlanPeriodicity.MENSAL) {
                    endDate.setMonth(endDate.getMonth() + 1);
                } else if (plan.periodicidade === PlanPeriodicity.TRIMESTRAL) {
                    endDate.setMonth(endDate.getMonth() + 3);
                } else if (plan.periodicidade === PlanPeriodicity.ANUAL) {
                    endDate.setFullYear(endDate.getFullYear() + 1);
                }

                db.enrollments.push({
                    id: uuidv4(),
                    memberId: newMember.id,
                    planId: planId,
                    inicio: startDate,
                    fim: endDate,
                    status: EnrollmentStatus.ATIVA,
                    diaVencimento: startDate.getDate(),
                });
            }
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
    const { memberData, planId } = req.body;
    const { id: memberId } = req.params;
    try {
        const memberIndex = db.members.findIndex(m => m.id === memberId);
        if (memberIndex === -1) {
            return res.status(404).json({ message: 'Membro não encontrado.' });
        }
        
        const updatedMember = { ...db.members[memberIndex], ...memberData };
        db.members[memberIndex] = updatedMember;

        if (planId) {
            const plan = db.plans.find(p => p.id === planId);
            if (plan) {
                const enrollmentIndex = db.enrollments.findIndex(e => e.memberId === memberId);
                const startDate = new Date();
                const endDate = new Date(startDate);
                if (plan.periodicidade === PlanPeriodicity.MENSAL) endDate.setMonth(endDate.getMonth() + 1);
                else if (plan.periodicidade === PlanPeriodicity.TRIMESTRAL) endDate.setMonth(endDate.getMonth() + 3);
                else if (plan.periodicidade === PlanPeriodicity.ANUAL) endDate.setFullYear(endDate.getFullYear() + 1);
                
                if (enrollmentIndex > -1) {
                    if (db.enrollments[enrollmentIndex].planId !== planId) {
                         db.enrollments[enrollmentIndex] = {
                             ...db.enrollments[enrollmentIndex],
                             planId,
                             inicio: startDate,
                             fim: endDate,
                             status: EnrollmentStatus.ATIVA,
                         };
                    }
                } else {
                     db.enrollments.push({
                        id: uuidv4(), memberId, planId, inicio: startDate, fim: endDate,
                        status: EnrollmentStatus.ATIVA, diaVencimento: startDate.getDate()
                    });
                }
            }
        }
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
        const memberIndex = db.members.findIndex(m => m.id === req.params.id);
        if (memberIndex === -1) {
            return res.status(404).json({ message: 'Membro não encontrado.' });
        }
        const updatedMember = { ...db.members[memberIndex], ativo: !db.members[memberIndex].ativo };
        db.members[memberIndex] = updatedMember;
        await addLog({ action: LogActionType.UPDATE, details: `Status do aluno "${updatedMember.nome}" alterado para ${updatedMember.ativo ? 'ATIVO' : 'INATIVO'}.`, userName: req.user.name, userRole: req.user.role });
        res.json(updatedMember);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar status do membro.' });
    }
});

// DELETE /api/members/:id - Excluir um membro
router.delete('/:id', authMiddleware, async (req: any, res) => {
    try {
        const memberId = req.params.id;
        const memberIndex = db.members.findIndex(m => m.id === memberId);
        if (memberIndex === -1) {
            return res.status(404).json({ message: 'Membro não encontrado.' });
        }
        const member = db.members[memberIndex];
        
        // Cascade delete
        const memberInvoices = db.invoices.filter(i => i.memberId === memberId);
        const invoiceIds = memberInvoices.map(i => i.id);
        
        db.payments = db.payments.filter(p => !invoiceIds.includes(p.invoiceId));
        db.invoices = db.invoices.filter(i => i.memberId !== memberId);
        db.enrollments = db.enrollments.filter(e => e.memberId !== memberId);
        db.notifications = db.notifications.filter(n => n.memberId !== memberId);
        
        db.members.splice(memberIndex, 1);
        
        await addLog({ action: LogActionType.DELETE, details: `Aluno "${member.nome}" e todos os seus dados foram excluídos.`, userName: req.user.name, userRole: req.user.role });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir membro.' });
    }
});

// GET /api/members/:id/enrollment
router.get('/:id/enrollment', authMiddleware, async (req, res) => {
    try {
        const enrollment = db.enrollments.find(e => e.memberId === req.params.id);
        if (enrollment) {
            const plan = db.plans.find(p => p.id === enrollment.planId);
            res.json({ ...enrollment, plan });
        } else {
            res.json(null);
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar matrícula.' });
    }
});

// GET /api/members/:id/invoices
router.get('/:id/invoices', authMiddleware, async (req, res) => {
    try {
        const memberInvoices = db.invoices
            .filter(i => i.memberId === req.params.id)
            .map(i => ({...i, payments: db.payments.filter(p => p.invoiceId === i.id) }))
            .sort((a,b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
        res.json(memberInvoices);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar faturas.' });
    }
});

export default router;
