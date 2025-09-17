import { getDB, simulateDelay } from './database';
import { InvoiceStatus } from '../../types';

export const getDashboardData = async () => {
    const db = getDB();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // --- KPIs ---
    const thisMonthPayments = db.payments.filter(p => new Date(p.data).getFullYear() === currentYear && new Date(p.data).getMonth() === currentMonth);
    
    const lastMonthDate = new Date(now);
    lastMonthDate.setMonth(now.getMonth() - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonthPayments = db.payments.filter(p => new Date(p.data).getFullYear() === lastMonthYear && new Date(p.data).getMonth() === lastMonth);

    const receitaMes = thisMonthPayments.reduce((sum, p) => sum + p.valor, 0);
    const receitaMesAnterior = lastMonthPayments.reduce((sum, p) => sum + p.valor, 0);
    
    const thisMonthExpenses = db.expenses.filter(e => new Date(e.data).getFullYear() === currentYear && new Date(e.data).getMonth() === currentMonth);
    const lastMonthExpensesList = db.expenses.filter(e => new Date(e.data).getFullYear() === lastMonthYear && new Date(e.data).getMonth() === lastMonth);
    
    const despesasMes = thisMonthExpenses.reduce((sum, e) => sum + e.valor, 0);
    const despesasMesAnterior = lastMonthExpensesList.reduce((sum, e) => sum + e.valor, 0);

    const lucroLiquido = receitaMes - despesasMes;
    const lucroLiquidoAnterior = receitaMesAnterior - despesasMesAnterior;

    const novosAlunosMes = db.enrollments.filter(e => new Date(e.inicio).getFullYear() === currentYear && new Date(e.inicio).getMonth() === currentMonth).length;
    const novosAlunosMesAnterior = db.enrollments.filter(e => new Date(e.inicio).getFullYear() === lastMonthYear && new Date(e.inicio).getMonth() === lastMonth).length;
    
    const aWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const faturasVencendo = db.invoices.filter(i => 
        i.status === InvoiceStatus.ABERTA &&
        new Date(i.vencimento) > now &&
        new Date(i.vencimento) <= aWeekFromNow
    ).length;

    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // --- Chart Data ---
    const cashFlowData = Array.from({ length: 6 }).map((_, i) => {
        const date = new Date(currentYear, currentMonth - 5 + i, 1);
        const month = date.getMonth();
        const year = date.getFullYear();

        const monthRevenue = db.payments
            .filter(p => new Date(p.data).getFullYear() === year && new Date(p.data).getMonth() === month)
            .reduce((sum, p) => sum + p.valor, 0);

        const monthExpenses = db.expenses
            .filter(exp => new Date(exp.data).getFullYear() === year && new Date(exp.data).getMonth() === month)
            .reduce((sum, exp) => sum + exp.valor, 0);

        return {
            name: date.toLocaleString('pt-BR', { month: 'short' }),
            Receita: monthRevenue,
            Despesa: monthExpenses,
            month: month,
            year: year
        };
    });
    
    // --- Recent Activity & At Risk ---
    const recentPayments = db.payments
        .sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 2)
        .map(p => {
            const invoice = db.invoices.find(i => i.id === p.invoiceId);
            return { id: p.id, type: 'payment', valor: p.valor, memberName: invoice?.member.nome, data: p.data };
        });

    const recentEnrollments = db.enrollments
        .sort((a,b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())
        .slice(0, 2)
        .map(e => ({ id: e.id, type: 'enrollment', memberName: e.member.nome, data: e.inicio }));

    const recentActivity = [...recentPayments, ...recentEnrollments]
        .sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 4);

    const atRiskMembers = db.invoices
        .filter(i => i.status === InvoiceStatus.ATRASADA)
        .slice(0, 5)
        .map(i => ({ id: i.member.id, nome: i.member.nome, reason: 'Fatura Atrasada', details: `Vencida em ${new Date(i.vencimento).toLocaleDateString()}` }));

    const data = {
        kpis: {
            receitaMes, despesasMes, lucroLiquido, novosAlunosMes, faturasVencendo,
            receitaChange: calculateChange(receitaMes, receitaMesAnterior),
            despesasChange: calculateChange(despesasMes, despesasMesAnterior),
            lucroChange: calculateChange(lucroLiquido, lucroLiquidoAnterior),
            novosAlunosChange: calculateChange(novosAlunosMes, novosAlunosMesAnterior),
        },
        monthlyGoal: { current: receitaMes, target: 25000 },
        cashFlowData,
        recentActivity,
        atRiskMembers,
    };
    
    return simulateDelay(data);
};
