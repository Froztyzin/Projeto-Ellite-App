import { allMembers, invoices, enrollments, plans, expenses, formatCurrency } from './database';
import { InvoiceStatus } from '../../types';
import { simulateDelay } from './database';

const findMember = (name: string) => {
    return allMembers.filter(m => m.nome.toLowerCase().includes(name.toLowerCase()));
};

const findOverdueInvoices = () => {
    return invoices.filter(i => i.status === InvoiceStatus.ATRASADA);
};

export const getAiAssistantResponse = async (question: string): Promise<string> => {
    await new Promise(res => setTimeout(res, 1000 + Math.random() * 1000));
    const q = question.toLowerCase();

    // --- Action: Find Member ---
    const findMemberMatch = q.match(/encontre o aluno (.*)|procure por (.*)|buscar (.*)/);
    const memberName = findMemberMatch?.[1] || findMemberMatch?.[2] || findMemberMatch?.[3];
    if (memberName) {
        const found = findMember(memberName.trim());
        if (found.length === 0) return `Não encontrei nenhum aluno com o nome parecido com "${memberName}".`;
        if (found.length === 1) {
            const member = found[0];
            const enrollment = enrollments.find(e => e.member.id === member.id);
            return `Encontrei!\n- Nome: ${member.nome}\n- Status: ${member.ativo ? 'Ativo' : 'Inativo'}\n- Email: ${member.email}\n- Telefone: ${member.telefone}\n- Plano: ${enrollment?.plan.nome || 'Nenhum'}`;
        }
        return `Encontrei ${found.length} alunos com esse nome:\n${found.map(m => `- ${m.nome}`).join('\n')}`;
    }

    // --- Action: Find Overdue Invoices ---
    if (q.includes('faturas atrasadas') || q.includes('inadimplentes')) {
        const found = findOverdueInvoices();
        if (found.length === 0) return 'Boas notícias! Não há faturas atrasadas no sistema.';
        const total = found.reduce((sum, i) => sum + i.valor, 0);
        let response = `Encontrei ${found.length} faturas atrasadas, totalizando ${formatCurrency(total)}.\n`;
        response += found.slice(0, 5).map(i => `- ${i.member.nome}: ${formatCurrency(i.valor)} (Venceu em ${new Date(i.vencimento).toLocaleDateString()})`).join('\n');
        if (found.length > 5) response += `\n...e mais ${found.length - 5} outras.`;
        return response;
    }
    
    // --- General Questions ---
    if (q.includes('aluno')) {
        if (q.includes('ativo')) {
            const count = allMembers.filter(m => m.ativo).length;
            return `Atualmente, temos ${count} alunos ativos.`;
        }
        if (q.includes('inativo')) {
            const count = allMembers.filter(m => !m.ativo).length;
            return `Há ${count} alunos inativos no sistema.`;
        }
        const count = allMembers.length;
        return `O número total de alunos (ativos e inativos) é ${count}.`;
    }

    if (q.includes('despesa')) {
        const days = q.match(/(\d+)\s*dias/)?.[1] ? parseInt(q.match(/(\d+)\s*dias/)?.[1] || '30', 10) : 30;
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        const total = expenses.filter(e => new Date(e.data) >= dateLimit).reduce((sum, e) => sum + e.valor, 0);
        return `O total de despesas nos últimos ${days} dias foi de ${formatCurrency(total)}.`;
    }
        
    if (q.includes('plano') && (q.includes('popular') || q.includes('vendido'))) {
        const planCounts = enrollments.reduce((acc, enrollment) => {
            acc[enrollment.plan.nome] = (acc[enrollment.plan.nome] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const mostPopular = Object.entries(planCounts).sort(([,a],[,b]) => b-a)[0];
        if(mostPopular) return `O plano mais popular é o "${mostPopular[0]}" com ${mostPopular[1]} matrículas.`;
        return `Não há dados suficientes para determinar o plano mais popular.`;
    }

    return "Desculpe, não consegui entender sua pergunta. Tente perguntar sobre alunos, faturas, despesas ou planos. Por exemplo: 'Quantos alunos ativos temos?' ou 'Encontre o aluno João'.";
};
