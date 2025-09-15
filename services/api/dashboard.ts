import { InvoiceStatus, EnrollmentStatus } from '../../types';
import { supabase } from '../../lib/supabaseClient';

const calculateMonthlyMetrics = async (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).toISOString();
    const lastDay = new Date(year, month + 1, 0).toISOString();

    const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('valor')
        .gte('data', firstDay)
        .lte('data', lastDay);
    if(paymentError) throw paymentError;

    const revenue = payments.reduce((sum, p) => sum + p.valor, 0);

    const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('valor')
        .gte('data', firstDay)
        .lte('data', lastDay);
    if(expenseError) throw expenseError;

    const expenseTotal = expenses.reduce((sum, exp) => sum + exp.valor, 0);

    const { count: newMembers, error: membersError } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('inicio', firstDay)
        .lte('inicio', lastDay);
     if(membersError) throw membersError;

    return { revenue, expenseTotal, newMembers: newMembers || 0 };
};

export const getDashboardData = async () => {
    const today = new Date();
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    const [currentMonthMetrics, prevMonthMetrics] = await Promise.all([
        calculateMonthlyMetrics(today),
        calculateMonthlyMetrics(prevMonthDate),
    ]);
    
    const { revenue: receitaMes, expenseTotal: despesasMes, newMembers: novosAlunosMes } = currentMonthMetrics;
    const lucroLiquido = receitaMes - despesasMes;
    
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const receitaChange = calculateChange(receitaMes, prevMonthMetrics.revenue);
    const despesasChange = calculateChange(despesasMes, prevMonthMetrics.expenseTotal);
    const lucroChange = calculateChange(lucroLiquido, prevMonthMetrics.revenue - prevMonthMetrics.expenseTotal);
    const novosAlunosChange = calculateChange(novosAlunosMes, prevMonthMetrics.newMembers);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const { count: faturasVencendo } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', InvoiceStatus.ABERTA)
        .gte('vencimento', today.toISOString())
        .lte('vencimento', sevenDaysFromNow.toISOString());

    const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('*, member:members(*)')
        .eq('status', InvoiceStatus.ATRASADA);
    
    const atRiskMembers = overdueInvoices?.map(invoice => ({
        ...invoice.member,
        reason: 'Fatura Atrasada',
        details: `Venceu em ${new Date(invoice.vencimento).toLocaleDateString()}`
    })) || [];

    const { data: recentPaymentsData } = await supabase
        .from('payments')
        .select('*, invoice:invoices(member:members(nome))')
        .order('data', { ascending: false })
        .limit(5);

    const recentActivity = recentPaymentsData?.map(p => ({
        id: p.id,
        valor: p.valor,
        memberName: p.invoice.member.nome,
        data: p.data,
        type: 'payment',
    })) || [];

    const cashFlowDataPromises = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return calculateMonthlyMetrics(d).then(metrics => ({
            name: d.toLocaleString('pt-BR', { month: 'short' }),
            Receita: metrics.revenue,
            Despesa: metrics.expenseTotal
        }));
    });
    const cashFlowData = (await Promise.all(cashFlowDataPromises)).reverse();
    
    const monthlyGoal = 15000;

    return {
        kpis: { 
            receitaMes, despesasMes, lucroLiquido, novosAlunosMes,
            faturasVencendo: faturasVencendo || 0,
            receitaChange, despesasChange, lucroChange, novosAlunosChange,
        },
        monthlyGoal: { target: monthlyGoal, current: receitaMes },
        atRiskMembers: atRiskMembers.slice(0, 5),
        recentActivity,
        cashFlowData,
    };
};