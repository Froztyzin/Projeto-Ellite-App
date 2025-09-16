import { InvoiceStatus } from '../../types';
import { supabase } from '../supabaseClient';

// Helper to get date range strings for a given month and year
const getMonthDateRange = (year: number, month: number) => {
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    return { startDate, endDate };
};

// Calculates key metrics for a specific month by querying the database
const calculateMonthlyMetrics = async (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const { startDate, endDate } = getMonthDateRange(year, month);

    // Calculate revenue
    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('valor')
        .gte('data', startDate)
        .lte('data', endDate);
    const revenue = paymentsError ? 0 : payments.reduce((sum, p) => sum + p.valor, 0);

    // Calculate expenses
    const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('valor')
        .gte('data', startDate)
        .lte('data', endDate);
    const expenseTotal = expensesError ? 0 : expenses.reduce((sum, e) => sum + e.valor, 0);

    // Calculate new members
    const { count: newMembers, error: membersError } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('inicio', startDate)
        .lte('inicio', endDate);
        
    return { revenue, expenseTotal, newMembers: membersError ? 0 : newMembers || 0 };
};


export const getDashboardData = async () => {
    const today = new Date();
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    // Get metrics for current and previous months concurrently
    const [currentMonthMetrics, prevMonthMetrics] = await Promise.all([
        calculateMonthlyMetrics(today),
        calculateMonthlyMetrics(prevMonthDate)
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
    
    // Get count of invoices due soon
    const { count: faturasVencendo } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', InvoiceStatus.ABERTA)
        .gte('vencimento', today.toISOString())
        .lte('vencimento', sevenDaysFromNow.toISOString());

    // Get members with overdue invoices
    const { data: atRiskInvoices } = await supabase
        .from('invoices')
        .select('vencimento, members(id, nome)')
        .eq('status', InvoiceStatus.ATRASADA)
        .limit(5);
    const atRiskMembers = atRiskInvoices?.map(inv => ({ 
        // Fix: The 'members' relation is typed as an array. Access the first element.
        id: inv.members[0]!.id,
        nome: inv.members[0]!.nome,
        reason: 'Fatura Atrasada', 
        details: `Venceu em ${new Date(inv.vencimento).toLocaleDateString()}`
    })) || [];

    // Get recent payments
    const { data: recentPayments } = await supabase
        .from('payments')
        .select('id, valor, data, invoices(members(nome))')
        .order('data', { ascending: false })
        .limit(5);
    const recentActivity = recentPayments?.map(p => ({
            id: p.id,
            valor: p.valor,
            // Fix: The 'invoices' and 'members' relations are typed as arrays. Access the first element of each.
            memberName: p.invoices?.[0]?.members?.[0]?.nome,
            data: p.data,
            type: 'payment',
        })) || [];


    // Get cash flow data for the last 6 months
    const cashFlowPromises = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        return calculateMonthlyMetrics(d).then(metrics => ({
            name: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
            month: d.getMonth(),
            year: d.getFullYear(),
            Receita: metrics.revenue,
            Despesa: metrics.expenseTotal,
        }));
    });
    const cashFlowData = (await Promise.all(cashFlowPromises)).reverse();
    
    // In a real scenario, the monthly goal would likely be stored in the settings table
    const monthlyGoal = 15000;

    return {
        kpis: { 
            receitaMes, despesasMes, lucroLiquido, novosAlunosMes,
            faturasVencendo: faturasVencendo || 0,
            receitaChange, despesasChange, lucroChange, novosAlunosChange,
        },
        monthlyGoal: { target: monthlyGoal, current: receitaMes },
        atRiskMembers,
        recentActivity,
        cashFlowData,
    };
};
