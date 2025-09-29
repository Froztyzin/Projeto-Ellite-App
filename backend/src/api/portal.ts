import { Router } from 'express';
import { addLog } from '../utils/logging';
import { LogActionType, Role } from '../types';
import { db } from '../data';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/portal/profile/:id
router.get('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const member = db.members.find(m => m.id === id);

        if (!member) {
            return res.status(404).json({ message: 'Aluno não encontrado' });
        }
        
        const enrollment = db.enrollments.find(e => e.memberId === id);
        const plan = enrollment ? db.plans.find(p => p.id === enrollment.planId) : null;
        
        const invoices = db.invoices
            .filter(i => i.memberId === id)
            .map(i => ({...i, payments: db.payments.filter(p => p.invoiceId === i.id)}))
            .sort((a,b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());

        res.json({
            member,
            enrollment: enrollment ? { ...enrollment, plan } : null,
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
        const memberIndex = db.members.findIndex(m => m.id === id);
        if (memberIndex === -1) {
            return res.status(404).json({ message: 'Aluno não encontrado' });
        }
        const member = db.members[memberIndex];
        member.email = email;
        member.telefone = telefone;
        db.members[memberIndex] = member;

        await addLog({
            action: LogActionType.UPDATE,
            details: `Aluno ${member.nome} atualizou seu perfil no portal.`,
            userName: member.nome,
            userRole: Role.ALUNO
        });

        res.json(member);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
});


// GET /api/portal/notifications/:studentId
router.get('/notifications/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const notifications = db.notifications
            .filter(n => n.memberId === studentId)
            .map(n => {
                const invoice = db.invoices.find(i => i.id === n.invoiceId);
                return {
                    ...n,
                    invoice: { competencia: invoice?.competencia || 'N/A', id: invoice?.id || '' }
                }
            })
            .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
            
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar notificações.' });
    }
});

export default router;
