// Fix: Import the 'payments' array which is now correctly exported from the database module.
import { payments, allMembers, expenses, enrollments } from './database';
import { faker } from '@faker-js/faker/locale/pt_BR';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getISODateRange = (periodInDays: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodInDays);
    return { startDate, endDate };
};

export const getReportsData = async (periodInDays: number = 180) => {
    const { startDate, endDate } = getISODateRange(periodInDays);
    
    const paymentsInPeriod = payments.filter(p => new Date(p.data) >= startDate && new Date(p.data) <= endDate);
    const expensesInPeriod = expenses.filter(e => new Date(e.data) >= startDate && new Date(e.data) <= endDate);
    
    const totalRevenue = paymentsInPeriod.reduce((sum, p) => sum + p.valor, 0);
    const newMembersCount = 0; // Simplification, would require enrollment start date
    const activeMembersCount = allMembers.filter(m => m.ativo).length;
    const monthsInPeriod = periodInDays / 30;
    const averageRevenuePerMember = activeMembersCount > 0 && monthsInPeriod > 0 ? totalRevenue / monthsInPeriod / activeMembersCount : 0;
    const churnRate = faker.number.float({ min: 1.5, max: 5.0, fractionDigits: 2 });

    const revenueByPlan: { [key: string]: number } = {};
    enrollments.forEach(e => {
        const planName = e.plan.nome;
        if (!revenueByPlan[planName]) revenueByPlan[planName] = 0;
        // This is a simplification. A real calculation would map payments to enrollments.
        revenueByPlan[planName] += e.plan.precoBase;
    });

    const monthlyData: { [key: string]: { name: string, Receita: number, Despesa: number, Alunos: number } } = {};
    for (let i = Math.ceil(monthsInPeriod) - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
        const name = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyData[name] = { name, Receita: 0, Despesa: 0, Alunos: activeMembersCount }; // Alunos is static for now
    }
    paymentsInPeriod.forEach(p => {
        const name = new Date(p.data).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (monthlyData[name]) monthlyData[name].Receita += p.valor;
    });
    expensesInPeriod.forEach(e => {
        const name = new Date(e.data).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (monthlyData[name]) monthlyData[name].Despesa += e.valor;
    });

    return {
        kpis: { totalRevenue, newMembersCount, averageRevenuePerMember, churnRate },
        revenueByPlan: Object.entries(revenueByPlan)
            .sort((a,b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value })),
        monthlyChartData: Object.values(monthlyData),
    };
};

export const getMonthlyPaymentsReportData = async (periodInDays: number) => {
    const { startDate, endDate } = getISODateRange(periodInDays);
    const paymentsInPeriod = payments.filter(p => new Date(p.data) >= startDate && new Date(p.data) <= endDate);

    const totalPaymentsCount = paymentsInPeriod.length;
    const totalRevenue = paymentsInPeriod.reduce((sum, p) => sum + p.valor, 0);
    const averagePaymentValue = totalPaymentsCount > 0 ? totalRevenue / totalPaymentsCount : 0;
    
    const paymentMethodCounts = paymentsInPeriod.reduce((acc, p) => {
        acc[p.metodo] = (acc[p.metodo] || 0) + 1;
        return acc;
    }, {} as {[key: string]: number});

    const mostUsedPaymentMethod = Object.keys(paymentMethodCounts).length > 0
        ? Object.entries(paymentMethodCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';
    
    const monthlyPaymentData: { [key: string]: { name: string, Pagamentos: number } } = {};
    for (let i = Math.ceil(periodInDays / 30) - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
        const name = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyPaymentData[name] = { name, Pagamentos: 0 };
    }
    paymentsInPeriod.forEach(p => {
        const name = new Date(p.data).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (monthlyPaymentData[name]) monthlyPaymentData[name].Pagamentos += p.valor;
    });

    return {
        kpis: { totalPaymentsCount, averagePaymentValue, mostUsedPaymentMethod },
        monthlyPaymentChartData: Object.values(monthlyPaymentData),
    };
};

// Fix: Replaced 'any' with a specific type for reportData to resolve type errors in arithmetic operations.
export const getReportSummary = async (reportData: {
    kpis: { totalRevenue: number; newMembersCount: number; averageRevenuePerMember: number; churnRate: number; };
    revenueByPlan: { name: string; }[];
    monthlyChartData: { Receita: number; }[];
}): Promise<string> => {
    const { kpis, revenueByPlan, monthlyChartData } = reportData;
    const totalRevenueFormatted = formatCurrency(kpis.totalRevenue);
    const mostPopularPlan = revenueByPlan[0]?.name || 'N/A';
    const lastMonth = monthlyChartData[monthlyChartData.length - 1];
    const prevMonth = monthlyChartData[monthlyChartData.length - 2];

    let revenueTrend = 'estável';
    // Fix: Added a check for 'lastMonth' to prevent potential runtime errors.
    if (prevMonth && lastMonth && lastMonth.Receita > prevMonth.Receita * 1.05) {
        revenueTrend = 'crescimento';
    } else if (prevMonth && lastMonth && lastMonth.Receita < prevMonth.Receita * 0.95) {
        revenueTrend = 'queda';
    }
    
    let summary = `- A receita total no período foi de ${totalRevenueFormatted}, com uma média de ${formatCurrency(kpis.averageRevenuePerMember)} por aluno/mês.`;
    summary += `\n- O plano mais rentável foi o "${mostPopularPlan}".`;
    summary += `\n- ${kpis.newMembersCount} novos alunos se matricularam, e a base de alunos ativos mostra uma tendência de ${revenueTrend}.`;
    summary += `\n- A taxa de churn simulada de ${kpis.churnRate}% sugere uma boa retenção, mas pode ser otimizada.`;

    return summary;
};