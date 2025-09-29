import { Router } from 'express';
import { InvoiceStatus } from '../types';
import { db } from '../data';

const router = Router();

router.post('/', async (req, res) => {
    const { question } = req.body;
    if (!question) {
        return res.status(400).json({ message: 'A pergunta é obrigatória.' });
    }
    
    const q = question.toLowerCase();

    try {
        let response = "Desculpe, não entendi a pergunta. Tente perguntar sobre alunos ativos, faturas atrasadas, ou procurar por um aluno específico.";

        if (q.includes('alunos ativos')) {
            const count = db.members.filter(m => m.ativo).length;
            response = `Atualmente, a academia tem ${count} alunos ativos.`;
        } else if (q.includes('faturas atrasadas')) {
            const count = db.invoices.filter(i => i.status === InvoiceStatus.ATRASADA).length;
            response = `Existem ${count} faturas atrasadas no sistema.`;
        } else if (q.includes('encontre o aluno') || q.includes('procurar por')) {
            const nameMatch = q.split(/aluno |por /).pop()?.trim();
            if (nameMatch) {
                const foundMembers = db.members.filter(m => m.nome.toLowerCase().includes(nameMatch));
                if (foundMembers.length > 0) {
                    response = `Encontrei ${foundMembers.length} aluno(s):\n` + foundMembers.map(m => `- ${m.nome} (Email: ${m.email})`).join('\n');
                } else {
                    response = `Não encontrei nenhum aluno com o nome parecido com "${nameMatch}".`;
                }
            }
        } else if (q.includes('receita do mês')) {
             const now = new Date();
             const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
             const receitaDoMes = db.payments
                .filter(p => new Date(p.data) >= startOfMonth)
                .reduce((sum, p) => sum + p.valor, 0);
            response = `A receita deste mês até agora é de R$ ${receitaDoMes.toFixed(2)}.`;
        }

        res.json({ response });
    } catch (error) {
        res.status(500).json({ message: "Ocorreu um erro ao processar sua solicitação." });
    }
});

export default router;
