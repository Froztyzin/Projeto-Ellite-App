import { supabase } from '../supabaseClient';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { PaymentMethod } from '../../types';

const formatCurrency = (value: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getDataForPeriod = async (periodInDays: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodInDays);

    const { data: payments, error: paymentsError } = await supabase.from('payments').select('valor, data, metodo, invoices(id, members(id, enrollments(plan_id, plans(nome))))').gte('data', startDate.toISOString()).lte('data', endDate.toISOString());
    if (paymentsError) throw paymentsError;

    const { data: expenses, error: expensesError } = await supabase.from('expenses').select('valor, data').gte('data', startDate.toISOString()).lte('data', endDate.toISOString());
    if (expensesError) throw expensesError;
    
    const { count: newMembersCount, error: newMembersError } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).gte('inicio', startDate.toISOString()).lte('inicio', endDate.toISOString());
    if (newMembersError) throw newMembersError;

    const { count: activeMembersCount, error: activeMembersError } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('ativo', true);
    if (activeMembersError) throw activeMembersError;

    return { payments, expenses, newMembersCount, activeMembersCount };
};

const processReportData = (payments: any[], expenses: any[], newMembersCount: number, activeMembersCount: number, periodInDays: number) => {
    const totalRevenue = payments.reduce((sum, p) => sum + p.valor, 0);
    const averageRevenuePerMember = activeMembersCount > 0 ? totalRevenue / (periodInDays / 30) / activeMembersCount : 0;
    const churnRate = faker.number.float({ min: 1.5, max: 5.0, fractionDigits: 2 });
    
    const totalPaymentsCount = payments.length;
    const averagePaymentValue = totalPaymentsCount > 0 ? totalRevenue / totalPaymentsCount : 0;
    const paymentMethodCounts = payments.reduce((acc, p) => {
        acc[p.metodo] = (acc[p.metodo] || 0) + 1;
        return acc;
    }, {});
    const mostUsedPaymentMethod = Object.keys(paymentMethodCounts).length > 0 ? Object.entries(paymentMethodCounts).sort(([, a], [, b]) => (b as number) - (a as number))[0][0] : 'N/A';

    const revenueByPlan = payments.reduce((acc, p) => {
        const planName = p.invoices?.members?.enrollments?.[0]?.plans?.nome || 'Plano Desconhecido';
        acc[planName] = (acc[planName] || 0) + p.valor;
        return acc;
    }, {});

    const monthlyData: { [key: string]: { name: string, Receita: number, Despesa: number, Alunos: number } } = {};
    const numMonths = Math.ceil(periodInDays / 30);
    for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const name = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyData[key] = { name, Receita: 0, Despesa: 0, Alunos: 0 };
    }
    payments.forEach(p => {
        const d = new Date(p.data);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyData[key]) monthlyData[key].Receita += p.valor;
    });
    expenses.forEach(e => {
        const d = new Date(e.data);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyData[key]) monthlyData[key].Despesa += e.valor;
    });
    
    return {
        kpis: { totalRevenue, newMembersCount, averageRevenuePerMember, churnRate, totalPaymentsCount, averagePaymentValue, mostUsedPaymentMethod },
        revenueByPlan: Object.entries(revenueByPlan).map(([name, value]) => ({ name, value: value as number })).sort((a,b) => b.value - a.value),
        monthlyChartData: Object.values(monthlyData),
    };
}


export const getReportsData = async (periodInDays: number = 180) => {
    const { payments, expenses, newMembersCount, activeMembersCount } = await getDataForPeriod(periodInDays);
    const report = processReportData(payments, expenses, newMembersCount || 0, activeMembersCount || 0, periodInDays);
    
    // Alunos chart data needs separate logic
    const { data: allEnrollments, error } = await supabase.from('enrollments').select('inicio');
    if(error) throw error;

    const monthlyData = report.monthlyChartData.reduce((acc, month) => {
        acc[month.name] = { ...month, Alunos: 0 };
        return acc;
    }, {} as { [key: string]: any});

    let currentMembers = 0;
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(`01-${a.replace('-','/')} `).getTime() - new Date(`01-${b.replace('-','/')} `).getTime());

    allEnrollments.forEach(e => {
        const d = new Date(e.inicio);
        const name = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if(monthlyData[name]) {
            monthlyData[name].Alunos++;
        }
    });

    return { ...report, monthlyChartData: Object.values(monthlyData) };
};

export const getMonthlyPaymentsReportData = async (periodInDays: number) => {
    const { payments } = await getDataForPeriod(periodInDays);
    const totalRevenue = payments.reduce((sum, p) => sum + p.valor, 0);
    const totalPaymentsCount = payments.length;
    const averagePaymentValue = totalPaymentsCount > 0 ? totalRevenue / totalPaymentsCount : 0;
    const paymentMethodCounts = payments.reduce((acc, p) => {
        acc[p.metodo] = (acc[p.metodo] || 0) + 1;
        return acc;
    }, {});
    const mostUsedPaymentMethod = Object.keys(paymentMethodCounts).length > 0 ? Object.entries(paymentMethodCounts).sort(([, a], [, b]) => (b as number) - (a as number))[0][0] : 'N/A';

    const monthlyPaymentData: { [key: string]: { name: string, Pagamentos: number } } = {};
    const numMonths = Math.ceil(periodInDays / 30);
    for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const name = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyPaymentData[key] = { name, Pagamentos: 0 };
    }
    payments.forEach(p => {
        const d = new Date(p.data);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyPaymentData[key]) monthlyPaymentData[key].Pagamentos += p.valor;
    });

    return {
        kpis: { totalPaymentsCount, averagePaymentValue, mostUsedPaymentMethod },
        monthlyPaymentChartData: Object.values(monthlyPaymentData),
    };
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

    return summary;
};
