import { Router } from 'express';
import prisma from '../lib/prisma';
import { InvoiceStatus } from '../types';

const router = Router();

router.get('/', async (req, res) => {
    const { periodInDays = 180 } = req.query;
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(periodInDays));

        const payments = await prisma.payment.findMany({ where: { data: { gte: startDate } } });
        const expenses = await prisma.expense.findMany({ where: { data: { gte: startDate } } });
        const newMembersCount = await prisma.member.count({ where: { createdAt: { gte: startDate } } });
        const activeMembersCount = await prisma.member.count({ where: { ativo: true }});
        
        const totalRevenue = payments.reduce((sum, p) => sum + p.valor, 0);
        const averageRevenuePerMember = activeMembersCount > 0 ? totalRevenue / activeMembersCount : 0;
        
        const monthlyData: { [key: string]: { Receita: number, Despesa: number, Alunos: number } } = {};
        
        const processData = (items: {data: Date, valor: number}[], type: 'Receita' | 'Despesa') => {
            items.forEach(item => {
                const date = new Date(item.data);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                if (!monthlyData[key]) monthlyData[key] = { Receita: 0, Despesa: 0, Alunos: 0 };
                monthlyData[key][type] += item.valor;
            });
        };
        processData(payments, 'Receita');
        processData(expenses, 'Despesa');
        
        // ... more complex logic for student growth would be needed for a perfect chart
        
        const monthlyChartData = Object.keys(monthlyData).map(key => {
            const [year, month] = key.split('-');
            return { name: new Date(Number(year), Number(month)).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }), ...monthlyData[key]};
        }).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());
        
        const revenueByPlan = await prisma.plan.findMany({
            where: { ativo: true },
            include: {
                enrollments: {
                    include: {
                        member: {
                            include: {
                                invoices: {
                                    include: {
                                        payments: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const revenueByPlanChartData = revenueByPlan.map(plan => {
            const value = plan.enrollments.reduce((planSum, enrollment) => {
                const memberRevenue = enrollment.member.invoices.reduce((invoiceSum, invoice) => {
                    return invoiceSum + invoice.payments.reduce((paymentSum, payment) => paymentSum + payment.valor, 0);
                }, 0);
                return planSum + memberRevenue;
            }, 0);
            return { name: plan.nome, value };
        }).filter(p => p.value > 0);

        res.json({
            kpis: { totalRevenue, newMembersCount, averageRevenuePerMember, churnRate: 5.2 }, // Mock churn
            monthlyChartData,
            revenueByPlan: revenueByPlanChartData,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerar dados de relatórios.' });
    }
});


router.get('/monthly-payments', async (req, res) => {
    // This endpoint can be simplified or merged, but kept for compatibility
    const { periodInDays = 90 } = req.query;
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(periodInDays));

        const allPayments = await prisma.payment.findMany({ where: { data: { gte: startDate } } });
        
        const totalPaymentsCount = allPayments.length;
        const totalPaymentValue = allPayments.reduce((sum, p) => sum + p.valor, 0);
        const averagePaymentValue = totalPaymentsCount > 0 ? totalPaymentValue / totalPaymentsCount : 0;

        const methodCounts = await prisma.payment.groupBy({
            by: ['metodo'],
            _count: { metodo: true },
            where: { data: { gte: startDate } },
            orderBy: { _count: { metodo: 'desc' } }
        });
        
        const mostUsedPaymentMethod = methodCounts[0]?.metodo || 'N/A';
        
        const monthlyPaymentTotals: { [key: string]: number } = {};
        allPayments.forEach(p => {
            const date = new Date(p.data);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (!monthlyPaymentTotals[key]) monthlyPaymentTotals[key] = 0;
            monthlyPaymentTotals[key] += p.valor;
        });

        const monthlyPaymentChartData = Object.keys(monthlyPaymentTotals).map(key => {
             const [year, month] = key.split('-');
            return { name: new Date(Number(year), Number(month)).toLocaleString('pt-BR', { month: 'short' }), Pagamentos: monthlyPaymentTotals[key]};
        });

        res.json({
            kpis: { totalPaymentsCount, averagePaymentValue, mostUsedPaymentMethod },
            monthlyPaymentChartData
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerar relatório de pagamentos.' });
    }
});


router.post('/summary', (req, res) => {
    const { reportData } = req.body;
    if (!reportData || !reportData.kpis) {
        return res.status(400).json({message: "Dados insuficientes para análise."})
    }
    const summary = `Análise da IA: Com uma receita total de R$${reportData.kpis.totalRevenue.toFixed(2)} e ${reportData.kpis.newMembersCount} novos alunos, o período parece promissor. A receita média por aluno está em R$${reportData.kpis.averageRevenuePerMember.toFixed(2)}. Recomenda-se monitorar a taxa de churn de ${reportData.kpis.churnRate}% para garantir a sustentabilidade.`;
    res.json({ summary });
});


export default router;
