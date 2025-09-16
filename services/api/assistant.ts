import { supabase } from '../supabaseClient';
import { InvoiceStatus } from '../../types';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const findMember = async (name: string) => {
    const { data } = await supabase.from('members').select('*').ilike('nome', `%${name}%`);
    return data || [];
};

const findOverdueInvoices = async () => {
    const { data } = await supabase
        .from('invoices')
        .select('valor, vencimento, members(nome)')
        .eq('status', InvoiceStatus.ATRASADA);
    return data || [];
};

export const getAiAssistantResponse = async (question: string): Promise<string> => {
    const q = question.toLowerCase();

    const findMemberMatch = q.match(/encontre o aluno (.*)|procure por (.*)|buscar (.*)/);
    const memberName = findMemberMatch?.[1] || findMemberMatch?.[2] || findMemberMatch?.[3];
    if (memberName) {
        const found = await findMember(memberName.trim());
        if (found.length === 0) return `Não encontrei nenhum aluno com o nome parecido com "${memberName}".`;
        if (found.length === 1) {
            const member = found[0];
            const { data: enrollment } = await supabase
                .from('enrollments')
                .select('plans(nome)')
                .eq('member_id', member.id)
                .maybeSingle();
            // Fix: The 'plans' relation is an object here due to .maybeSingle(), but typed as an array. Use a type assertion.
            return `Encontrei!\n- Nome: ${member.nome}\n- Status: ${member.ativo ? 'Ativo' : 'Inativo'}\n- Email: ${member.email}\n- Telefone: ${member.telefone}\n- Plano: ${(enrollment?.plans as any)?.nome || 'Nenhum'}`;
        }
        return `Encontrei ${found.length} alunos com esse nome:\n${found.map(m => `- ${m.nome}`).join('\n')}`;
    }

    if (q.includes('faturas atrasadas') || q.includes('inadimplentes')) {
        const found = await findOverdueInvoices();
        if (found.length === 0) return 'Boas notícias! Não há faturas atrasadas no sistema.';
        const total = found.reduce((sum, i) => sum + i.valor, 0);
        let response = `Encontrei ${found.length} faturas atrasadas, totalizando ${formatCurrency(total)}.\n`;
        // Fix: The 'members' relation is typed as an array. Access the first element.
        response += found.slice(0, 5).map(i => `- ${i.members?.[0]?.nome}: ${formatCurrency(i.valor)} (Venceu em ${new Date(i.vencimento).toLocaleDateString()})`).join('\n');
        if (found.length > 5) response += `\n...e mais ${found.length - 5} outras.`;
        return response;
    }
    
    if (q.includes('aluno')) {
        if (q.includes('ativo')) {
            const { count } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('ativo', true);
            return `Atualmente, temos ${count} alunos ativos.`;
        }
        if (q.includes('inativo')) {
            const { count } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('ativo', false);
            return `Há ${count} alunos inativos no sistema.`;
        }
        const { count } = await supabase.from('members').select('*', { count: 'exact', head: true });
        return `O número total de alunos (ativos e inativos) é ${count}.`;
    }

    if (q.includes('despesa')) {
        const days = q.match(/(\d+)\s*dias/)?.[1] ? parseInt(q.match(/(\d+)\s*dias/)?.[1] || '30', 10) : 30;
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        const { data: expenses } = await supabase.from('expenses').select('valor').gte('data', dateLimit.toISOString());
        const total = expenses?.reduce((sum, e) => sum + e.valor, 0) || 0;
        return `O total de despesas nos últimos ${days} dias foi de ${formatCurrency(total)}.`;
    }
        
    if (q.includes('plano') && (q.includes('popular') || q.includes('vendido'))) {
        // This is a complex query that is best done with an RPC function in Supabase.
        // We will return a placeholder response.
        return 'Para obter o plano mais popular, uma consulta mais avançada é necessária. Esta funcionalidade pode ser implementada com uma função de banco de dados (RPC) para maior eficiência.';
    }

    return "Desculpe, não consegui entender sua pergunta. Tente perguntar sobre alunos, faturas, despesas ou planos.";
};