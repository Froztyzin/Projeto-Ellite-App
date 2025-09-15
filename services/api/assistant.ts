import { supabase } from '../../lib/supabaseClient';
import { InvoiceStatus } from '../../types';
import { formatCurrency } from '../../lib/utils';


const findMember = async (name: string) => {
    const { data } = await supabase
        .from('members')
        .select('*')
        .ilike('nome', `%${name}%`);
    return data || [];
};

const findOverdueInvoices = async () => {
    const { data } = await supabase
        .from('invoices')
        .select('*, member:members(nome)')
        .eq('status', InvoiceStatus.ATRASADA);
    return data || [];
};

export const getAiAssistantResponse = async (question: string): Promise<string> => {
    await new Promise(res => setTimeout(res, 1000 + Math.random() * 1000));
    const q = question.toLowerCase();

    const findMemberMatch = q.match(/encontre o aluno (.*)|procure por (.*)|buscar (.*)/);
    const memberName = findMemberMatch?.[1] || findMemberMatch?.[2] || findMemberMatch?.[3];
    if (memberName) {
        const found = await findMember(memberName.trim());
        if (found.length === 0) return `Não encontrei nenhum aluno com o nome parecido com "${memberName}".`;
        if (found.length === 1) {
            const member = found[0];
            const { data: enrollment } = await supabase.from('enrollments').select('*, plan:plans(nome)').eq('member_id', member.id).single();
            return `Encontrei!\n- Nome: ${member.nome}\n- Status: ${member.ativo ? 'Ativo' : 'Inativo'}\n- Email: ${member.email}\n- Telefone: ${member.telefone}\n- Plano: ${enrollment?.plan?.nome || 'Nenhum'}`;
        }
        return `Encontrei ${found.length} alunos com esse nome:\n${found.map(m => `- ${m.nome}`).join('\n')}`;
    }

    if (q.includes('faturas atrasadas') || q.includes('inadimplentes')) {
        const found = await findOverdueInvoices();
        if (found.length === 0) return 'Boas notícias! Não há faturas atrasadas no sistema.';
        const total = found.reduce((sum, i) => sum + i.valor, 0);
        let response = `Encontrei ${found.length} faturas atrasadas, totalizando ${formatCurrency(total)}.\n`;
        response += found.slice(0, 5).map(i => `- ${i.member.nome}: ${formatCurrency(i.valor)} (Venceu em ${new Date(i.vencimento).toLocaleDateString()})`).join('\n');
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

    if (q.includes('plano') && (q.includes('popular') || q.includes('vendido'))) {
        const { data, error } = await supabase.rpc('get_popular_plan');
        if (error || !data) return 'Não consegui determinar o plano mais popular no momento.';
        return `O plano mais popular é o "${data.plan_name}" com ${data.enrollment_count} matrículas.`;
    }

    return "Desculpe, não consegui entender sua pergunta. Tente perguntar sobre alunos, faturas, despesas ou planos.";
};