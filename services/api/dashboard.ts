import { InvoiceStatus } from '../../types';
// Fix: Import the 'payments' array which is now correctly exported from the database module.
import { allMembers, invoices, payments, expenses } from './database';

const calculateMonthlyMetrics = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const revenue = payments
        .filter(p => {
            const pDate = new Date(p.data);
            return pDate.getFullYear() === year && pDate.getMonth() === month;
        })
        .reduce((sum, p) => sum + p.valor, 0);

    const expenseTotal = expenses
        .filter(e => {
            const eDate = new Date(e.data);
            return eDate.getFullYear() === year && eDate.getMonth() === month;
        })
        .reduce((sum, e) => sum + e.valor, 0);

    const newMembers = allMembers
        .filter(m => {
            // This is a simplification. A real app would check enrollment start date.
            // For mock data, we'll assume new members based on their creation,
            // but we don't have that field, so we'll simulate.
            return false;
        }).length;
        
    return { revenue, expenseTotal, newMembers };
};

export const getDashboardData = async () => {
    const today = new Date();
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    const currentMonthMetrics = calculateMonthlyMetrics(today);
    const prevMonthMetrics = calculateMonthlyMetrics(prevMonthDate);

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
    
    const faturasVencendo = invoices.filter(i =>
        i.status === InvoiceStatus.ABERTA &&
        new Date(i.vencimento) >= today &&
        new Date(i.vencimento) <= sevenDaysFromNow
    ).length;
    
    const atRiskMembers = invoices
        .filter(inv => inv.status === InvoiceStatus.ATRASADA)
        .slice(0, 5)
        .map(inv => ({ 
            id: inv.member.id,
            nome: inv.member.nome,
            reason: 'Fatura Atrasada', 
            details: `Venceu em ${new Date(inv.vencimento).toLocaleDateString()}`
        }));

    const recentActivity = payments
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5)
        .map(p => {
            const invoice = invoices.find(i => i.id === p.invoiceId);
            return {
                id: p.id,
                valor: p.valor,
                memberName: invoice?.member.nome || 'N/A',
                data: p.data,
                type: 'payment',
            };
        });

    const cashFlowData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const metrics = calculateMonthlyMetrics(d);
        return {
            name: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
            month: d.getMonth(),
            year: d.getFullYear(),
            Receita: metrics.revenue,
            Despesa: metrics.expenseTotal,
        };
    }).reverse();
    
    const monthlyGoal = 15000;

    return {
        kpis: { 
            receitaMes, despesasMes, lucroLiquido, novosAlunosMes,
            faturasVencendo,
            receitaChange, despesasChange, lucroChange, novosAlunosChange,
        },
        monthlyGoal: { target: monthlyGoal, current: receitaMes },
        atRiskMembers,
        recentActivity,
        cashFlowData,
    };
};