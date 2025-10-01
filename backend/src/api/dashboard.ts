import { Router } from 'express';
import { supabase } from '../lib/supabaseClient';
import authMiddleware from '../middleware/authMiddleware';
import { toCamelCase } from '../utils/mappers';

const router = Router();

const getMonthDateRange = (year: number, month: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
}

router.get('/', authMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const currentMonthRange = getMonthDateRange(now.getFullYear(), now.getMonth());
        const lastMonthRange = getMonthDateRange(now.getFullYear(), now.getMonth() - 1);

        const { data: kpiData, error: kpiError } = await supabase.rpc('get_dashboard_kpis', {
            current_month_start: currentMonthRange.startDate,
            current_month_end: currentMonthRange.endDate,
            last_month_start: lastMonthRange.startDate,
            last_month_end: lastMonthRange.endDate
        });
        if (kpiError) throw kpiError;
        
        const { data: cashFlowData, error: cashFlowError } = await supabase.rpc('get_cash_flow_last_6_months');
        if (cashFlowError) throw cashFlowError;

        const { data: recentActivityData, error: activityError } = await supabase
            .from('payments')
            .select('id, valor, data, invoices(members(nome))')
            .order('data', { ascending: false })
            .limit(3);
        if (activityError) throw activityError;
        
        const recentActivity = recentActivityData.map((p: any) => ({
            id: p.id, type: 'payment', valor: p.valor,
            memberName: p.invoices.members.nome, data: p.data
        }));
        
        const { data: atRiskMembersData, error: atRiskError } = await supabase.rpc('get_at_risk_members');
        if (atRiskError) throw atRiskError;
        
        res.json({
            kpis: toCamelCase(kpiData),
            monthlyGoal: { current: kpiData.receita_mes, target: 25000 },
            cashFlowData: cashFlowData.map(d => ({...d, month: d.month_num, year: d.year_num, name: d.month_name })),
            recentActivity,
            atRiskMembers: atRiskMembersData.map(m => toCamelCase(m)),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar dados do dashboard.' });
    }
});

export default router;