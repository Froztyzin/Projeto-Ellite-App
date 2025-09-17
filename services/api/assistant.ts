import { getDB, simulateDelay } from './database';

export const getAiAssistantResponse = async (question: string): Promise<string> => {
    const db = getDB();
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('quantos alunos ativos')) {
        const activeCount = db.members.filter(m => m.ativo).length;
        return simulateDelay(`Atualmente, temos ${activeCount} alunos ativos.`);
    }

    if (lowerQuestion.includes('receita') && lowerQuestion.includes('mês')) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const thisMonthPayments = db.payments.filter(p => new Date(p.data).getFullYear() === currentYear && new Date(p.data).getMonth() === currentMonth);
        const revenue = thisMonthPayments.reduce((sum, p) => sum + p.valor, 0);
        return simulateDelay(`A receita deste mês, com base nos pagamentos recebidos, é de R$ ${revenue.toFixed(2).replace('.',',')}.`);
    }
    
    if (lowerQuestion.includes('encontre o aluno')) {
        const name = lowerQuestion.split('encontre o aluno')[1]?.trim();
        if (name) {
            const found = db.members.filter(m => m.nome.toLowerCase().includes(name));
            if (found.length > 0) {
                return simulateDelay(`Encontrei ${found.length} aluno(s) com o nome parecido: ${found.map(f => f.nome).join(', ')}.`);
            }
            return simulateDelay(`Não encontrei nenhum aluno com o nome "${name}".`);
        }
    }

    return simulateDelay("Desculpe, ainda estou aprendendo. Tente perguntar 'quantos alunos ativos temos?' ou 'qual a receita do mês?'");
};
