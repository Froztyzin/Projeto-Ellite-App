import { invoices, expenses, allMembers, enrollments } from './database';
import { InvoiceStatus, EnrollmentStatus } from '../../types';
import { simulateDelay } from './database';

const calculateMonthlyMetrics = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const revenue = invoices.reduce((total, inv) => {
        const paymentTotal = inv.payments
            ?.filter(p => {
                const pDate = new Date(p.data);
                return pDate.getFullYear() === year && pDate.getMonth() === month;
            })
            .reduce((sum, p) => sum + p.valor, 0) || 0;
        return total + paymentTotal;
    }, 0);

    const expenseTotal = expenses
        .filter(exp => {
            const eDate = new Date(exp.data);
            return eDate.getFullYear() === year && eDate.getMonth() === month;
        })
        .reduce((sum, exp) => sum + exp.valor, 0);

    const newMembers = enrollments.filter(e => {
         const sDate = new Date(e.inicio);
         return sDate.getFullYear() === year && sDate.getMonth() === month;
    }).length;

    return { revenue, expenseTotal, newMembers };
};

export const getDashboardData = () => {
    // Current and Previous Month Metrics
    const today = new Date();
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    const currentMonthMetrics = calculateMonthlyMetrics(today);
    const prevMonthMetrics = calculateMonthlyMetrics(prevMonthDate);

    const { revenue: receitaMes, expenseTotal: despesasMes, newMembers: novosAlunosMes } = currentMonthMetrics;
    const lucroLiquido = receitaMes - despesasMes;
    
    // --- Percentage Change Calculations ---
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const receitaChange = calculateChange(receitaMes, prevMonthMetrics.revenue);
    const despesasChange = calculateChange(despesasMes, prevMonthMetrics.expenseTotal);
    const lucroChange = calculateChange(lucroLiquido, prevMonthMetrics.revenue - prevMonthMetrics.expenseTotal);
    const novosAlunosChange = calculateChange(novosAlunosMes, prevMonthMetrics.newMembers);


    // --- Other KPIs ---
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const faturasVencendo = invoices.filter(inv => 
        inv.status === InvoiceStatus.ABERTA &&
        new Date(inv.vencimento) >= today &&
        new Date(inv.vencimento) <= sevenDaysFromNow
    ).length;

    // --- Actionable Intelligence Lists ---
    const atRiskMembers = [];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // 1. Members with overdue invoices
    const overdueInvoices = invoices.filter(inv => inv.status === InvoiceStatus.ATRASADA);
    for (const invoice of overdueInvoices) {
        if (!atRiskMembers.find(m => m.id === invoice.member.id)) {
            atRiskMembers.push({ ...invoice.member, reason: 'Fatura Atrasada', details: `Venceu em ${new Date(invoice.vencimento).toLocaleDateString()}` });
        }
    }

    // 2. Members with plans expiring soon
    const expiringEnrollments = enrollments.filter(e => 
        e.status === EnrollmentStatus.ATIVA &&
        new Date(e.fim) <= thirtyDaysFromNow &&
        !atRiskMembers.find(m => m.id === e.member.id) // Avoid duplicates
    );
     for (const enrollment of expiringEnrollments) {
        atRiskMembers.push({ ...enrollment.member, reason: 'Plano Expirando', details: `Expira em ${new Date(enrollment.fim).toLocaleDateString()}` });
    }

    // --- Recent Activity Feed ---
    const recentPayments = invoices
        .flatMap(i => i.payments?.map(p => ({ ...p, memberName: i.member.nome, type: 'payment' })) || [])
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5);

    const recentEnrollments = enrollments
        .map(e => ({ id: e.id, memberName: e.member.nome, data: e.inicio, type: 'enrollment' }))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 3);
        
    const recentActivity = [...recentPayments, ...recentEnrollments]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5);


    // --- Cash Flow Chart ---
    const cashFlowData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const metrics = calculateMonthlyMetrics(d);
        return { 
            name: d.toLocaleString('pt-BR', { month: 'short' }), 
            Receita: metrics.revenue, 
            Despesa: metrics.expenseTotal 
        };
    }).reverse();
    
    const monthlyGoal = 15000;

    return simulateDelay({
        kpis: { 
            receitaMes, 
            despesasMes,
            lucroLiquido,
            novosAlunosMes,
            faturasVencendo,
            receitaChange,
            despesasChange,
            lucroChange,
            novosAlunosChange,
        },
        monthlyGoal: {
            target: monthlyGoal,
            current: receitaMes,
        },
        atRiskMembers: atRiskMembers.slice(0, 5), // Limit to 5 for the dashboard
        recentActivity,
        cashFlowData,
    });
};
