import { Router } from 'express';
import { supabase } from '../lib/supabaseClient';
import { InvoiceStatus } from '../types';

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
            const { count, error } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('ativo', true);
            if(error) throw error;
            response = `Atualmente, a academia tem ${count} alunos ativos.`;

        } else if (q.includes('faturas atrasadas')) {
            const { count, error } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', InvoiceStatus.ATRASADA);
            if(error) throw error;
            response = `Existem ${count} faturas atrasadas no sistema.`;
            
        } else if (q.includes('encontre o aluno') || q.includes('procurar por')) {
            const nameMatch = q.split(/aluno |por /).pop()?.trim();
            if (nameMatch) {
                const { data, error } = await supabase.from('members').select('nome, email').ilike('nome', `%${nameMatch}%`);
                if(error) throw error;

                if (data && data.length > 0) {
                    response = `Encontrei ${data.length} aluno(s):\n` + data.map(m => `- ${m.nome} (Email: ${m.email})`).join('\n');
                } else {
                    response = `Não encontrei nenhum aluno com o nome parecido com "${nameMatch}".`;
                }
            }
        } else if (q.includes('receita do mês')) {
             const now = new Date();
             const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
             const { data, error } = await supabase.rpc('get_revenue_in_date_range', {
                 start_date: startOfMonth,
                 end_date: now.toISOString()
             });
             if (error) throw error;

            response = `A receita deste mês até agora é de R$ ${data.toFixed(2)}.`;
        }

        res.json({ response });
    } catch (error) {
        res.status(500).json({ message: "Ocorreu um erro ao processar sua solicitação." });
    }
});

export default router;