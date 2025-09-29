import { Router } from 'express';
import { InvoiceStatus } from '../types';
import { db } from '../data';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// Helper to get start and end dates for a month
const getMonthDateRange = (year: number, month: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
}

router.get('/', authMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const currentMonthRange = getMonthDateRange(now.getFullYear(), now.getMonth());
        const lastMonthRange = getMonthDateRange(now.getFullYear(), now.getMonth() - 1);

        const getRevenueInRange = (start: Date, end: Date) => 
            db.payments
              .filter(p => new Date(p.data) >= start && new Date(p.data) <= end)
              .reduce((sum, p) => sum + p.valor, 0);

        const getExpensesInRange = (start: Date, end: Date) =>
            db.expenses
              .filter(e => new Date(e.data) >= start && new Date(e.data) <= end)
              .reduce((sum, e) => sum + e.valor, 0);

        const getNewMembersInRange = (start: Date, end: Date) =>
            db.enrollments.filter(e => new Date(e.inicio) >= start && new Date(e.inicio) <= end).length;
        
        const receitaMes = getRevenueInRange(currentMonthRange.startDate, currentMonthRange.endDate);
        const receitaMesAnterior = getRevenueInRange(lastMonthRange.startDate, lastMonthRange.endDate);
        const despesasMes = getExpensesInRange(currentMonthRange.startDate, currentMonthRange.endDate);
        const despesasMesAnterior = getExpensesInRange(lastMonthRange.startDate, lastMonthRange.endDate);
        const novosAlunosMes = getNewMembersInRange(currentMonthRange.startDate, currentMonthRange.endDate);
        const novosAlunosMesAnterior = getNewMembersInRange(lastMonthRange.startDate, lastMonthRange.endDate);

        const getChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };
        
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);
        const faturasVencendo = db.invoices.filter(i => {
            const vencimento = new Date(i.vencimento);
            return vencimento >= now && vencimento <= sevenDaysFromNow && [InvoiceStatus.ABERTA, InvoiceStatus.PARCIALMENTE_PAGA].includes(i.status)
        }).length;


        // Cash Flow Chart Data (last 6 months)
        const cashFlowData = Array.from({ length: 6 }).map((_, i) => {
            const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            const range = getMonthDateRange(date.getFullYear(), date.getMonth());
            return {
                name: date.toLocaleString('pt-BR', { month: 'short' }),
                month: date.getMonth(),
                year: date.getFullYear(),
                Receita: getRevenueInRange(range.startDate, range.endDate),
                Despesa: getExpensesInRange(range.startDate, range.endDate),
            };
        });
        
        const recentPayments = [...db.payments]
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            .slice(0, 3);
            
        const recentActivity = recentPayments.map(p => {
            const invoice = db.invoices.find(i => i.id === p.invoiceId);
            const member = db.members.find(m => m.id === invoice?.memberId);
            return {
                id: p.id,
                type: 'payment',
                valor: p.valor,
                memberName: member?.nome || 'Desconhecido',
                data: p.data
            };
        });

        const atRiskMembersInvoices = db.invoices
            .filter(i => i.status === 'ATRASADA')
            .slice(0, 5);
        
        const atRiskMembers = atRiskMembersInvoices.map(i => {
            const member = db.members.find(m => m.id === i.memberId);
            return { 
                id: member!.id, 
                nome: member!.nome, 
                reason: 'Fatura Atrasada', 
                details: `Competência ${i.competencia}` 
            };
        });

        res.json({
            kpis: {
                receitaMes,
                receitaChange: getChange(receitaMes, receitaMesAnterior),
                despesasMes,
                despesasChange: getChange(despesasMes, despesasMesAnterior),
                lucroLiquido: receitaMes - despesasMes,
                lucroChange: getChange(receitaMes - despesasMes, receitaMesAnterior - despesasMesAnterior),
                novosAlunosMes,
                novosAlunosChange: getChange(novosAlunosMes, novosAlunosMesAnterior),
                faturasVencendo,
            },
            monthlyGoal: { current: receitaMes, target: 25000 },
            cashFlowData,
            recentActivity,
            atRiskMembers,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar dados do dashboard.' });
    }
});

export default router;