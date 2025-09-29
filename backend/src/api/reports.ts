import { Router } from 'express';
import { InvoiceStatus } from '../types';
import { db } from '../data';

const router = Router();

const getMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

router.get('/', async (req, res) => {
    const { periodInDays = 180 } = req.query;
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(periodInDays));

        const payments = db.payments.filter(p => new Date(p.data) >= startDate);
        const expenses = db.expenses.filter(e => new Date(e.data) >= startDate);
        const newEnrollments = db.enrollments.filter(e => new Date(e.inicio) >= startDate);
        
        const activeMembersCount = db.members.filter(m => m.ativo).length;
        
        const totalRevenue = payments.reduce((sum, p) => sum + p.valor, 0);
        const averageRevenuePerMember = activeMembersCount > 0 ? totalRevenue / activeMembersCount : 0;
        
        const monthlyData: { [key: string]: { Receita: number; Despesa: number; "Novos Alunos": number } } = {};
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const key = getMonthKey(currentDate);
            monthlyData[key] = { Receita: 0, Despesa: 0, "Novos Alunos": 0 };
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        payments.forEach(item => {
            const key = getMonthKey(new Date(item.data));
            if (monthlyData[key]) monthlyData[key].Receita += item.valor;
        });
        expenses.forEach(item => {
            const key = getMonthKey(new Date(item.data));
            if (monthlyData[key]) monthlyData[key].Despesa += item.valor;
        });
        newEnrollments.forEach(item => {
            const key = getMonthKey(new Date(item.inicio));
            if (monthlyData[key]) monthlyData[key]["Novos Alunos"] += 1;
        });

        const monthlyChartData = Object.keys(monthlyData)
            .map(key => {
                const [year, month] = key.split('-').map(Number);
                const date = new Date(year, month);
                return { 
                    date,
                    name: date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }), 
                    ...monthlyData[key]
                };
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        const planRevenues: { [planName: string]: number } = {};
        for (const payment of payments) {
            const invoice = db.invoices.find(i => i.id === payment.invoiceId);
            const enrollment = db.enrollments.find(e => e.memberId === invoice?.memberId);
            const plan = db.plans.find(p => p.id === enrollment?.planId);
            if (plan) {
                planRevenues[plan.nome] = (planRevenues[plan.nome] || 0) + payment.valor;
            }
        }
        
        const revenueByPlanChartData = Object.keys(planRevenues)
            .map(name => ({ name, value: planRevenues[name] }))
            .filter(p => p.value > 0);

        res.json({
            kpis: { 
                totalRevenue, 
                newMembersCount: newEnrollments.length, 
                averageRevenuePerMember, 
                churnRate: 5.2 // Mock churn 
            },
            monthlyChartData,
            revenueByPlan: revenueByPlanChartData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao gerar dados de relatórios.' });
    }
});


router.get('/monthly-payments', async (req, res) => {
    const { periodInDays = 90 } = req.query;
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(periodInDays));

        const allPayments = db.payments.filter(p => new Date(p.data) >= startDate);
        
        const totalPaymentsCount = allPayments.length;
        const totalPaymentValue = allPayments.reduce((sum, p) => sum + p.valor, 0);
        const averagePaymentValue = totalPaymentsCount > 0 ? totalPaymentValue / totalPaymentsCount : 0;

        const methodCounts: {[key: string]: number} = {};
        allPayments.forEach(p => {
            methodCounts[p.metodo] = (methodCounts[p.metodo] || 0) + 1;
        });
        const mostUsedPaymentMethod = Object.keys(methodCounts).sort((a, b) => methodCounts[b] - methodCounts[a])[0] || 'N/A';
        
        const monthlyPaymentTotals: { [key: string]: number } = {};
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const key = getMonthKey(currentDate);
            monthlyPaymentTotals[key] = 0;
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        allPayments.forEach(p => {
            const key = getMonthKey(new Date(p.data));
            if (monthlyPaymentTotals.hasOwnProperty(key)) {
                monthlyPaymentTotals[key] += p.valor;
            }
        });

        const monthlyPaymentChartData = Object.keys(monthlyPaymentTotals)
            .map(key => {
                const [year, month] = key.split('-').map(Number);
                const date = new Date(year, month);
                return { 
                    date,
                    name: date.toLocaleString('pt-BR', { month: 'short' }), 
                    Pagamentos: monthlyPaymentTotals[key]
                };
            })
            .sort((a,b) => a.date.getTime() - b.date.getTime());

        res.json({
            kpis: { totalPaymentsCount, averagePaymentValue, mostUsedPaymentMethod },
            monthlyPaymentChartData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao gerar relatório de pagamentos.' });
    }
});


router.post('/summary', (req, res) => {
    const { reportData } = req.body;
    if (!reportData || !reportData.kpis) {
        return res.status(400).json({message: "Dados insuficientes para análise."})
    }
    const { totalRevenue, newMembersCount, averageRevenuePerMember, churnRate } = reportData.kpis;
    
    const revenue = Number(totalRevenue);
    const avgRevenue = Number(averageRevenuePerMember);
    const churn = Number(churnRate);

    if (isNaN(revenue) || isNaN(avgRevenue) || isNaN(churn)) {
        return res.status(400).json({ message: "Dados inválidos para análise." });
    }

    const summary = `Análise da IA: Com uma receita total de R$${revenue.toFixed(2)} e ${newMembersCount} novos alunos, o período parece promissor. A receita média por aluno está em R$${avgRevenue.toFixed(2)}. Recomenda-se monitorar a taxa de churn de ${churn.toFixed(1)}% para garantir a sustentabilidade.`;
    res.json({ summary });
});


export default router;
