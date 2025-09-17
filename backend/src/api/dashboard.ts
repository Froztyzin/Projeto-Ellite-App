import { Router } from 'express';
import prisma from '../lib/prisma';
import { InvoiceStatus } from '../types';

const router = Router();

// Helper to get start and end dates for a month
const getMonthDateRange = (year: number, month: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
}

router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const currentMonthRange = getMonthDateRange(now.getFullYear(), now.getMonth());
        const lastMonthRange = getMonthDateRange(now.getFullYear(), now.getMonth() - 1);

        const getRevenueInRange = (start: Date, end: Date) => prisma.payment.aggregate({ _sum: { valor: true }, where: { data: { gte: start, lte: end } } });
        const getExpensesInRange = (start: Date, end: Date) => prisma.expense.aggregate({ _sum: { valor: true }, where: { data: { gte: start, lte: end } } });
        const getNewMembersInRange = (start: Date, end: Date) => prisma.enrollment.count({ where: { createdAt: { gte: start, lte: end } } });
        
        const [
            receitaMesData, receitaMesAnteriorData,
            despesasMesData, despesasMesAnteriorData,
            novosAlunosMes, novosAlunosMesAnterior
        ] = await Promise.all([
            getRevenueInRange(currentMonthRange.startDate, currentMonthRange.endDate),
            getRevenueInRange(lastMonthRange.startDate, lastMonthRange.endDate),
            getExpensesInRange(currentMonthRange.startDate, currentMonthRange.endDate),
            getExpensesInRange(lastMonthRange.startDate, lastMonthRange.endDate),
            getNewMembersInRange(currentMonthRange.startDate, currentMonthRange.endDate),
            getNewMembersInRange(lastMonthRange.startDate, lastMonthRange.endDate)
        ]);

        const receitaMes = receitaMesData._sum.valor || 0;
        const receitaMesAnterior = receitaMesAnteriorData._sum.valor || 0;
        const despesasMes = despesasMesData._sum.valor || 0;
        const despesasMesAnterior = despesasMesAnteriorData._sum.valor || 0;

        const getChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };
        
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);
        const faturasVencendo = await prisma.invoice.count({
            where: {
                vencimento: { gte: now, lte: sevenDaysFromNow },
                status: InvoiceStatus.ABERTA
            }
        });

        // Cash Flow Chart Data (last 6 months)
        const cashFlowPromises = Array.from({ length: 6 }).map(async (_, i) => {
            const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            const range = getMonthDateRange(date.getFullYear(), date.getMonth());
            const [revenue, expense] = await Promise.all([
                getRevenueInRange(range.startDate, range.endDate),
                getExpensesInRange(range.startDate, range.endDate)
            ]);
            return {
                name: date.toLocaleString('pt-BR', { month: 'short' }),
                month: date.getMonth(),
                year: date.getFullYear(),
                Receita: revenue._sum.valor || 0,
                Despesa: expense._sum.valor || 0,
            };
        });
        const cashFlowData = await Promise.all(cashFlowPromises);
        
        const recentPayments = await prisma.payment.findMany({
            take: 3, orderBy: { data: 'desc' },
            include: { invoice: { include: { member: { select: { nome: true } } } } }
        });

        const recentActivity = recentPayments.map(p => ({
            id: p.id, type: 'payment', valor: p.valor,
            memberName: p.invoice.member.nome, data: p.data
        }));

        const atRiskMembers = await prisma.invoice.findMany({
            where: { status: 'ATRASADA' }, distinct: ['memberId'], take: 5,
            include: { member: { select: { id: true, nome: true } } }
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
            atRiskMembers: atRiskMembers.map(i => ({ id: i.member.id, nome: i.member.nome, reason: 'Fatura Atrasada', details: `Competência ${i.competencia}` })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar dados do dashboard.' });
    }
});

export default router;
