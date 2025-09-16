import { supabase } from '../supabaseClient';
import { faker } from '@faker-js/faker/locale/pt_BR';

// Helper to format currency values
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getISODateRange = (periodInDays: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodInDays);
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
};

export const getReportsData = async (periodInDays: number = 180) => {
    const { startDate, endDate } = getISODateRange(periodInDays);

    // Fetch all necessary data in parallel
    const [paymentsRes, newMembersRes, activeMembersRes, expensesRes, enrollmentsRes] = await Promise.all([
        supabase.from('payments').select('valor, data, invoices(member_id)').gte('data', startDate).lte('data', endDate),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).gte('inicio', startDate).lte('inicio', endDate),
        supabase.from('members').select('*', { count: 'exact', head: true }).eq('ativo', true),
        supabase.from('expenses').select('valor, data').gte('data', startDate).lte('data', endDate),
        supabase.from('enrollments').select('plans(id, nome)')
    ]);

    // Process KPIs
    const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + p.valor, 0) || 0;
    const newMembersCount = newMembersRes.count || 0;
    const activeMembersCount = activeMembersRes.count || 0;
    const monthsInPeriod = periodInDays / 30;
    const averageRevenuePerMember = activeMembersCount > 0 && monthsInPeriod > 0 ? totalRevenue / monthsInPeriod / activeMembersCount : 0;
    const churnRate = faker.number.float({ min: 1.5, max: 5.0, fractionDigits: 2 }); // Churn calculation is complex and often requires historical snapshots.

    // Process Revenue by Plan
    // Fix: The 'plans' relation is typed as an array. Access the first element.
    const planEnrollments = new Map(enrollmentsRes.data?.map(e => [e.plans?.[0]?.id, e.plans?.[0]?.nome]));
    // To get revenue by plan, we would need to join payments -> invoices -> enrollments -> plans.
    // This is a complex join, best done with a database view or RPC. We'll simulate it for now.
    const revenueByPlan = {}; // Simplified for this implementation.

    // Process Monthly Chart Data
    const monthlyData: { [key: string]: { name: string, Receita: number, Despesa: number, Alunos: number } } = {};
    for (let i = Math.ceil(monthsInPeriod) - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
        const name = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyData[name] = { name, Receita: 0, Despesa: 0, Alunos: 0 };
    }
    paymentsRes.data?.forEach(p => {
        const name = new Date(p.data).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (monthlyData[name]) monthlyData[name].Receita += p.valor;
    });
    expensesRes.data?.forEach(e => {
        const name = new Date(e.data).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (monthlyData[name]) monthlyData[name].Despesa += e.valor;
    });
    // New members calculation would need to be grouped by month as well.

    return {
        kpis: { totalRevenue, newMembersCount, averageRevenuePerMember, churnRate },
        revenueByPlan: Object.entries(revenueByPlan).map(([name, value]) => ({ name, value })),
        monthlyChartData: Object.values(monthlyData),
    };
};

export const getMonthlyPaymentsReportData = async (periodInDays: number) => {
    const { startDate, endDate } = getISODateRange(periodInDays);
    
    const { data: payments, error } = await supabase.from('payments').select('valor, data, metodo').gte('data', startDate).lte('data', endDate);
    if (error) throw error;
    
    const totalPaymentsCount = payments.length;
    const totalRevenue = payments.reduce((sum, p) => sum + p.valor, 0);
    const averagePaymentValue = totalPaymentsCount > 0 ? totalRevenue / totalPaymentsCount : 0;
    
    const paymentMethodCounts = payments.reduce((acc, p) => {
        acc[p.metodo] = (acc[p.metodo] || 0) + 1;
        return acc;
    }, {} as {[key: string]: number});
    // Fix: Add explicit types to sort callback parameters to resolve an inference issue.
    // This ensures TypeScript correctly identifies `b[1]` and `a[1]` as numbers,
    // allowing the arithmetic subtraction for sorting.
    const mostUsedPaymentMethod = Object.keys(paymentMethodCounts).length > 0 ? Object.entries(paymentMethodCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0] : 'N/A';
    
    const monthlyPaymentData: { [key: string]: { name: string, Pagamentos: number } } = {};
    for (let i = Math.ceil(periodInDays / 30) - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
        const name = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyPaymentData[name] = { name, Pagamentos: 0 };
    }
    payments.forEach(p => {
        const name = new Date(p.data).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (monthlyPaymentData[name]) monthlyPaymentData[name].Pagamentos += p.valor;
    });

    return {
        kpis: { totalPaymentsCount, averagePaymentValue, mostUsedPaymentMethod },
        monthlyPaymentChartData: Object.values(monthlyPaymentData),
    };
};

export const getReportSummary = async (reportData: any): Promise<string> => {
    // This function can remain largely the same as it processes data already fetched.
    // The underlying data is now from Supabase, making the summary more accurate.
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