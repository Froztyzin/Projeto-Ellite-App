import { invoices, expenses, enrollments, allMembers, formatCurrency } from './database';
import { simulateDelay } from './database';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { PaymentMethod } from '../../types';

export const getReportsData = (periodInDays: number = 180) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodInDays);

    const periodPayments = invoices.flatMap(i => i.payments || []).filter(p => {
        const paymentDate = new Date(p.data);
        return paymentDate >= startDate && paymentDate <= endDate;
    });

    const periodExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.data);
        return expenseDate >= startDate && expenseDate <= endDate;
    });

    const totalRevenue = periodPayments.reduce((sum, p) => sum + p.valor, 0);
    const newMembersCount = enrollments.filter(e => new Date(e.inicio) >= startDate && new Date(e.inicio) <= endDate).length;
    const activeMembersCount = allMembers.filter(m => m.ativo).length;
    const averageRevenuePerMember = activeMembersCount > 0 ? totalRevenue / (periodInDays / 30) / activeMembersCount : 0;
    const churnRate = faker.number.float({ min: 1.5, max: 5.0, fractionDigits: 2 });
    
    // New KPIs for payments report
    const totalPaymentsCount = periodPayments.length;
    const averagePaymentValue = totalPaymentsCount > 0 ? totalRevenue / totalPaymentsCount : 0;
    const paymentMethodCounts: { [key in PaymentMethod]?: number } = {};
    periodPayments.forEach(p => {
        paymentMethodCounts[p.metodo] = (paymentMethodCounts[p.metodo] || 0) + 1;
    });
    const mostUsedPaymentMethod = Object.keys(paymentMethodCounts).length > 0
        ? (Object.entries(paymentMethodCounts) as [PaymentMethod, number][]).sort(([, a], [, b]) => b - a)[0][0]
        : 'N/A';


    const revenueByPlan: { [key: string]: { name: string, value: number } } = {};
    periodPayments.forEach(p => {
        const invoice = invoices.find(i => i.id === p.invoiceId);
        if (invoice) {
            const enrollment = enrollments.find(e => e.member.id === invoice.member.id);
            if (enrollment) {
                if (!revenueByPlan[enrollment.plan.id]) {
                    revenueByPlan[enrollment.plan.id] = { name: enrollment.plan.nome, value: 0 };
                }
                revenueByPlan[enrollment.plan.id].value += p.valor;
            }
        }
    });

    const monthlyData: { [key: string]: { name: string, Receita: number, Despesa: number, Alunos: number } } = {};
    const monthlyPaymentData: { [key: string]: { name: string, Pagamentos: number } } = {};
    const numMonths = Math.ceil(periodInDays / 30);

    for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const name = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (!monthlyData[key]) {
            monthlyData[key] = { name, Receita: 0, Despesa: 0, Alunos: 0 };
        }
        if (!monthlyPaymentData[key]) {
            monthlyPaymentData[key] = { name, Pagamentos: 0 };
        }
    }

    periodPayments.forEach(p => {
        const d = new Date(p.data);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyData[key]) monthlyData[key].Receita += p.valor;
        if (monthlyPaymentData[key]) monthlyPaymentData[key].Pagamentos += p.valor;
    });

    periodExpenses.forEach(e => {
        const d = new Date(e.data);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyData[key]) monthlyData[key].Despesa += e.valor;
    });

    const initialMemberCount = allMembers.filter(m => new Date(enrollments.find(e => e.member.id === m.id)?.inicio || 0) < startDate).length;
    let memberCount = initialMemberCount;
    Object.keys(monthlyData).forEach(key => {
        const [year, month] = key.split('-').map(Number);
        const newInMonth = enrollments.filter(e => {
            const d = new Date(e.inicio);
            return d.getFullYear() === year && d.getMonth() === month;
        }).length;
        memberCount += newInMonth;
        monthlyData[key].Alunos = memberCount;
    });

    return simulateDelay({
        kpis: {
            totalRevenue,
            newMembersCount,
            averageRevenuePerMember,
            churnRate,
            totalPaymentsCount,
            averagePaymentValue,
            mostUsedPaymentMethod,
        },
        revenueByPlan: Object.values(revenueByPlan).sort((a,b) => b.value - a.value),
        monthlyChartData: Object.values(monthlyData),
        monthlyPaymentChartData: Object.values(monthlyPaymentData),
    });
};

export const getMonthlyPaymentsReportData = (periodInDays: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodInDays);

    const periodPayments = invoices.flatMap(i => i.payments || []).filter(p => {
        const paymentDate = new Date(p.data);
        return paymentDate >= startDate && paymentDate <= endDate;
    });

    const totalRevenue = periodPayments.reduce((sum, p) => sum + p.valor, 0);

    const totalPaymentsCount = periodPayments.length;
    const averagePaymentValue = totalPaymentsCount > 0 ? totalRevenue / totalPaymentsCount : 0;
    const paymentMethodCounts: { [key in PaymentMethod]?: number } = {};
    periodPayments.forEach(p => {
        paymentMethodCounts[p.metodo] = (paymentMethodCounts[p.metodo] || 0) + 1;
    });
    const mostUsedPaymentMethod = Object.keys(paymentMethodCounts).length > 0
        ? (Object.entries(paymentMethodCounts) as [PaymentMethod, number][]).sort(([, a], [, b]) => b - a)[0][0]
        : 'N/A';

    const monthlyPaymentData: { [key: string]: { name: string, Pagamentos: number } } = {};
    const numMonths = Math.ceil(periodInDays / 30);

    for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const name = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (!monthlyPaymentData[key]) {
            monthlyPaymentData[key] = { name, Pagamentos: 0 };
        }
    }

    periodPayments.forEach(p => {
        const d = new Date(p.data);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyPaymentData[key]) monthlyPaymentData[key].Pagamentos += p.valor;
    });

    return simulateDelay({
        kpis: {
            totalPaymentsCount,
            averagePaymentValue,
            mostUsedPaymentMethod,
        },
        monthlyPaymentChartData: Object.values(monthlyPaymentData),
    });
};

export const getReportSummary = async (reportData: any): Promise<string> => {
    const { kpis, revenueByPlan, monthlyChartData } = reportData;

    const totalRevenueFormatted = formatCurrency(kpis.totalRevenue);
    const mostPopularPlan = revenueByPlan[0]?.name || 'N/A';
    const lastMonth = monthlyChartData[monthlyChartData.length - 1];
    const prevMonth = monthlyChartData[monthlyChartData.length - 2];

    let revenueTrend = 'estável';
    if (prevMonth && lastMonth.Receita > prevMonth.Receita * 1.05) {
        revenueTrend = 'crescimento';
    } else if (prevMonth && lastMonth.Receita < prevMonth.Receita * 0.95) {
        revenueTrend = 'queda';
    }
    
    let summary = `- A receita total no período foi de ${totalRevenueFormatted}, com uma média de ${formatCurrency(kpis.averageRevenuePerMember)} por aluno/mês.`;
    summary += `\n- O plano mais rentável foi o "${mostPopularPlan}".`;
    summary += `\n- ${kpis.newMembersCount} novos alunos se matricularam, e a base de alunos ativos mostra uma tendência de ${revenueTrend}.`;
    summary += `\n- A taxa de churn simulada de ${kpis.churnRate}% sugere uma boa retenção, mas pode ser otimizada.`;

    return simulateDelay(summary);
};