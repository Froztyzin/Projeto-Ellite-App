import { Router } from 'express';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase } from '../utils/mappers';

const router = Router();

router.get('/', async (req, res) => {
    const { periodInDays = 180 } = req.query;
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(periodInDays));

        const { data, error } = await supabase.rpc('get_reports_data', {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        });
        if (error) throw error;
        
        res.json({
            kpis: toCamelCase(data.kpis),
            monthlyChartData: data.monthly_chart_data,
            revenueByPlan: data.revenue_by_plan,
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

        const { data, error } = await supabase.rpc('get_monthly_payments_report', {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        });
        if (error) throw error;

        res.json({
            kpis: toCamelCase(data.kpis),
            monthlyPaymentChartData: data.monthly_payment_chart_data
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

    const summary = `Análise da IA: Com uma receita total de ${formatCurrency(revenue)} e ${newMembersCount} novos alunos, o período parece promissor. A receita média por aluno está em ${formatCurrency(avgRevenue)}. Recomenda-se monitorar a taxa de churn de ${churn.toFixed(1)}% para garantir a sustentabilidade.`;
    res.json({ summary });
});

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};


export default router;