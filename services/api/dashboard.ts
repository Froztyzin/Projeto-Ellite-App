import { supabase } from '../supabaseClient';
import { fromInvoice, fromExpense, fromEnrollment } from './mappers';
import { InvoiceStatus, EnrollmentStatus } from '../../types';

const calculateMonthlyMetrics = async (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0).toISOString();

    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('valor, data')
        .gte('data', startDate)
        .lte('data', endDate);

    if (paymentsError) throw paymentsError;
    const revenue = payments.reduce((sum, p) => sum + p.valor, 0);

    const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('valor, data')
        .gte('data', startDate)
        .lte('data', endDate);

    if (expensesError) throw expensesError;
    const expenseTotal = expenses.reduce((sum, e) => sum + e.valor, 0);

    const { count: newMembers, error: membersError } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('inicio', startDate)
        .lte('inicio', endDate);

    if (membersError) throw membersError;
    
    return { revenue, expenseTotal, newMembers: newMembers || 0 };
};

export const getDashboardData = async () => {
    // Current and Previous Month Metrics
    const today = new Date();
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    const currentMonthMetrics = await calculateMonthlyMetrics(today);
    const prevMonthMetrics = await calculateMonthlyMetrics(prevMonthDate);

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
    
    const { count: faturasVencendo, error: faturasError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', InvoiceStatus.ABERTA)
        .gte('vencimento', today.toISOString())
        .lte('vencimento', sevenDaysFromNow.toISOString());

    if (faturasError) throw faturasError;
    
    const { data: overdueInvoicesData, error: overdueError } = await supabase
        .from('invoices')
        .select('*, members(*)')
        .eq('status', InvoiceStatus.ATRASADA)
        .limit(10);
    
    if (overdueError) throw overdueError;

    let atRiskMembers: any[] = overdueInvoicesData.map(inv => {
        const member = fromInvoice(inv).member;
        return { ...member, reason: 'Fatura Atrasada', details: `Venceu em ${new Date(inv.vencimento).toLocaleDateString()}`};
    });
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    const { data: expiringEnrollmentsData, error: expiringError } = await supabase
        .from('enrollments')
        .select('*, members(*)')
        .eq('status', EnrollmentStatus.ATIVA)
        .lte('fim', thirtyDaysFromNow.toISOString())
        .gte('fim', today.toISOString());
    
    if (expiringError) throw expiringError;
    
    expiringEnrollmentsData.forEach(e => {
        const member = fromEnrollment(e).member;
        if (!atRiskMembers.find(m => m.id === member.id)) {
            atRiskMembers.push({ ...member, reason: 'Plano Expirando', details: `Expira em ${new Date(e.fim).toLocaleDateString()}`});
        }
    });

    const { data: recentPaymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*, invoices(members(nome))')
        .order('data', { ascending: false })
        .limit(5);

    if (paymentsError) throw paymentsError;

    const recentActivity = recentPaymentsData.map((p: any) => ({
        id: p.id,
        valor: p.valor,
        memberName: p.invoices.members.nome,
        data: p.data,
        type: 'payment',
    }));

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
            receitaMes, 
            despesasMes,
            lucroLiquido,
            novosAlunosMes,
            faturasVencendo: faturasVencendo || 0,
            receitaChange,
            despesasChange,
            lucroChange,
            novosAlunosChange,
        },
        monthlyGoal: {
            target: monthlyGoal,
            current: receitaMes,
        },
        atRiskMembers: atRiskMembers.slice(0, 5),
        recentActivity: recentActivity.slice(0, 5),
        cashFlowData,
    };
};