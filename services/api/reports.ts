import { getDB, simulateDelay } from './database';
import { InvoiceStatus, PaymentMethod } from '../../types';

const getRevenueFromPayments = (payments: any[]) => payments.reduce((sum, p) => sum + p.valor, 0);

export const getReportsData = async (periodInDays: number = 180) => {
    const db = getDB();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodInDays);
    
    const relevantPayments = db.payments.filter(p => new Date(p.data) >= startDate && new Date(p.data) <= endDate);
    const relevantExpenses = db.expenses.filter(e => new Date(e.data) >= startDate && new Date(e.data) <= endDate);
    const relevantEnrollments = db.enrollments.filter(e => new Date(e.inicio) >= startDate && new Date(e.inicio) <= endDate);

    // --- KPIs ---
    const totalRevenue = getRevenueFromPayments(relevantPayments);
    const newMembersCount = relevantEnrollments.length;
    const activeMembersCount = db.members.filter(m => m.ativo).length;
    const monthsInPeriod = periodInDays / 30;
    const averageRevenuePerMember = activeMembersCount > 0 && monthsInPeriod > 0 ? totalRevenue / activeMembersCount / monthsInPeriod : 0;
    const churnRate = 5.2; // Simulated

    // --- Monthly Chart Data ---
    const monthlyData: { [key: string]: { Receita: number; Despesa: number; Alunos: number } } = {};
    let dateIterator = new Date(startDate);
    while(dateIterator <= endDate) {
        const key = `${dateIterator.getFullYear()}-${dateIterator.getMonth()}`;
        if (!monthlyData[key]) {
            monthlyData[key] = { Receita: 0, Despesa: 0, Alunos: 0 };
        }
        dateIterator.setMonth(dateIterator.getMonth() + 1);
    }

    relevantPayments.forEach(p => {
        const d = new Date(p.data);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyData[key]) {
            monthlyData[key].Receita += p.valor;
        }
    });

    relevantExpenses.forEach(exp => {
        const d = new Date(exp.data);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyData[key]) {
            monthlyData[key].Despesa += exp.valor;
        }
    });

    Object.keys(monthlyData).forEach(key => {
        const [year, month] = key.split('-').map(Number);
        const membersAtMonth = db.members.filter(m => {
            const enrollment = db.enrollments.find(e => e.member.id === m.id);
            if (!enrollment) return false;
            const enrollmentStart = new Date(enrollment.inicio);
            return enrollmentStart.getFullYear() < year || (enrollmentStart.getFullYear() === year && enrollmentStart.getMonth() <= month);
        }).length;
        monthlyData[key].Alunos = membersAtMonth;
    });

    const monthlyChartData = Object.keys(monthlyData).map(key => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month), 1);
        return {
            name: date.toLocaleString('pt-BR', { month: 'short' }),
            ...monthlyData[key]
        };
    }).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());


    // --- Revenue by Plan ---
    const revenueByPlan: { [key: string]: number } = {};
    relevantPayments.forEach(p => {
        const invoice = db.invoices.find(i => i.id === p.invoiceId);
        const enrollment = invoice ? db.enrollments.find(e => e.member.id === invoice.member.id) : null;
        if (enrollment) {
            const planName = enrollment.plan.nome;
            if (!revenueByPlan[planName]) revenueByPlan[planName] = 0;
            revenueByPlan[planName] += p.valor;
        }
    });
    
    const revenueByPlanChart = Object.keys(revenueByPlan).map(name => ({
        name, value: revenueByPlan[name]
    }));

    const data = {
        kpis: { totalRevenue, newMembersCount, averageRevenuePerMember, churnRate },
        monthlyChartData,
        revenueByPlan: revenueByPlanChart,
    };
    
    return simulateDelay(data);
};

export const getMonthlyPaymentsReportData = async (periodInDays: number) => {
    const db = getDB();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodInDays);

    const relevantPayments = db.payments.filter(p => {
        const pDate = new Date(p.data);
        return pDate >= startDate && pDate <= endDate;
    });

    // --- KPIs ---
    const totalPaymentsCount = relevantPayments.length;
    const totalPaymentsValue = relevantPayments.reduce((sum, p) => sum + p.valor, 0);
    const averagePaymentValue = totalPaymentsCount > 0 ? totalPaymentsValue / totalPaymentsCount : 0;
    
    const methodCounts = relevantPayments.reduce((acc, p) => {
        acc[p.metodo] = (acc[p.metodo] || 0) + 1;
        return acc;
    }, {} as { [key in PaymentMethod]: number });

    const mostUsedPaymentMethod = Object.keys(methodCounts).length > 0
        ? (Object.keys(methodCounts) as PaymentMethod[]).reduce((a, b) => methodCounts[a] > methodCounts[b] ? a : b)
        : 'N/A';
    
    // --- Monthly Chart Data ---
    const monthlyData: { [key: string]: number } = {};
    relevantPayments.forEach(p => {
        const d = new Date(p.data);
        const key = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyData[key] = (monthlyData[key] || 0) + p.valor;
    });

    const monthlyPaymentChartData = Object.keys(monthlyData).map(name => ({
        name, Pagamentos: monthlyData[name]
    }));

    return simulateDelay({
        kpis: { totalPaymentsCount, averagePaymentValue, mostUsedPaymentMethod },
        monthlyPaymentChartData
    });
};


export const getReportSummary = async (reportData: any): Promise<string> => {
    const formatCurrency = (value: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const summary = `
Análise do Período:
- A receita total foi de ${formatCurrency(reportData.kpis.totalRevenue)}, um indicador sólido.
- O crescimento de novos alunos (${reportData.kpis.newMembersCount}) está estável.
- Recomenda-se focar em estratégias de retenção para diminuir a taxa de churn simulada de ${reportData.kpis.churnRate}%.
- O plano "${reportData.revenueByPlan[0]?.name || 'N/A'}" é o mais popular, respondendo pela maior parte da receita.
    `.trim();
    return simulateDelay(summary);
};
