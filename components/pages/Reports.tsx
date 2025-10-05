import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, 
    LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';
import { getReportsData, getReportSummary, getMonthlyPaymentsReportData } from '../../services/api/reports';
import { formatCurrency } from '../../lib/utils';
import { FaDollarSign, FaUserPlus, FaChartLine, FaPercentage, FaBrain, FaSpinner, FaCreditCard, FaCalculator, FaStar } from 'react-icons/fa';
import SkeletonCard from '../shared/skeletons/SkeletonCard';
import SkeletonLineChart from '../shared/skeletons/SkeletonLineChart';

const ReportCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = React.memo(({ title, children, className = '' }) => (
    <div className={`bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm ${className}`}>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">{title}</h2>
        {children}
    </div>
));
ReportCard.displayName = 'ReportCard';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactElement<{ className?: string }> }> = React.memo(({ title, value, icon }) => (
    <div className="bg-card p-5 rounded-lg border border-slate-700 shadow-sm flex items-center space-x-4">
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-900 text-primary-400">
            {React.cloneElement(icon, { className: 'h-6 w-6' })}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
));
KpiCard.displayName = 'KpiCard';

const AiSummary: React.FC<{ reportData: any }> = React.memo(({ reportData }) => {
    const { data: summary, isLoading, error } = useQuery({
        queryKey: ['reportSummary', reportData],
        queryFn: () => getReportSummary(reportData),
        enabled: !!reportData,
        staleTime: 1000 * 60 * 15, // 15 minutes
    });

    return (
        <div className="bg-primary-900/50 p-6 rounded-lg border border-primary-700/50 mb-8">
            <h2 className="text-xl font-semibold text-primary-400 mb-3 flex items-center">
                <FaBrain className="mr-3" />
                Resumo da IA
            </h2>
            {isLoading && <p className="text-slate-300 flex items-center"><FaSpinner className="animate-spin mr-2" />Analisando dados...</p>}
            {error && <p className="text-red-400">Não foi possível gerar o resumo.</p>}
            {summary && <p className="text-slate-300 whitespace-pre-line">{summary}</p>}
        </div>
    );
});
AiSummary.displayName = 'AiSummary';


const Reports: React.FC = () => {
    const [period, setPeriod] = useState<number>(180);
    const [paymentPeriod, setPaymentPeriod] = useState<number>(90);

    const { data: reportData, isLoading, error } = useQuery({
        queryKey: ['reportsData', period],
        queryFn: () => getReportsData(period),
        staleTime: 1000 * 60 * 15, // 15 minutes
    });

    const { data: paymentReportData, isLoading: paymentReportIsLoading } = useQuery({
        queryKey: ['monthlyPaymentsReport', paymentPeriod],
        queryFn: () => getMonthlyPaymentsReportData(paymentPeriod),
        staleTime: 1000 * 60 * 15, // 15 minutes
    });
    
    if (error) {
        return <div className="text-center p-10 text-red-500">Falha ao carregar os dados dos relatórios.</div>;
    }

    const COLORS = ['#10b981', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#f59e0b'];

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Relatórios Avançados</h1>
                <div className="w-full sm:w-auto">
                    <label htmlFor="period-select" className="sr-only">Período</label>
                    <select id="period-select" value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="block w-full rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2">
                        <option value={30}>Últimos 30 dias</option>
                        <option value={90}>Últimos 3 meses</option>
                        <option value={180}>Últimos 6 meses</option>
                        <option value={365}>Último ano</option>
                    </select>
                </div>
            </div>
            
            {reportData && !isLoading && <AiSummary reportData={reportData} />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {isLoading || !reportData ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : (
                    <>
                        <KpiCard title="Receita Total" value={formatCurrency(reportData.kpis.totalRevenue)} icon={<FaDollarSign />} />
                        <KpiCard title="Novos Alunos" value={reportData.kpis.newMembersCount.toString()} icon={<FaUserPlus />} />
                        <KpiCard title="Receita Média / Aluno" value={formatCurrency(reportData.kpis.averageRevenuePerMember)} icon={<FaChartLine />} />
                        <KpiCard title="Taxa de Churn (Simulada)" value={`${reportData.kpis.churnRate}%`} icon={<FaPercentage />} />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ReportCard title="Receita vs. Despesas">
                    {isLoading || !reportData ? <SkeletonLineChart /> : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.monthlyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                            <YAxis tickFormatter={(value) => formatCurrency(Number(value))} tick={{ fill: '#94a3b8' }}/>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/>
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            <Line type="monotone" dataKey="Receita" name="Receita" stroke="#10b981" strokeWidth={2} />
                            <Line type="monotone" dataKey="Despesa" name="Despesa" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                    )}
                </ReportCard>

                <ReportCard title="Novos Alunos por Mês">
                     {isLoading || !reportData ? <SkeletonLineChart /> : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.monthlyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                            <YAxis domain={['dataMin - 5', 'auto']} allowDecimals={false} tick={{ fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            <Line type="monotone" dataKey="Novos Alunos" name="Novos Alunos" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                     )}
                </ReportCard>

                <ReportCard title="Resumo de Pagamentos Mensais">
                    <div className="flex justify-end mb-4">
                        <label htmlFor="payment-period-select" className="sr-only">Selecionar período</label>
                        <select 
                            id="payment-period-select"
                            value={paymentPeriod} 
                            onChange={(e) => setPaymentPeriod(Number(e.target.value))} 
                            className="block w-full sm:w-auto rounded-md border-slate-600 bg-slate-800 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2"
                        >
                            <option value={30}>Último Mês</option>
                            <option value={90}>Últimos 3 Meses</option>
                            <option value={180}>Últimos 6 Meses</option>
                        </select>
                    </div>
                    {paymentReportIsLoading || !paymentReportData ? <SkeletonLineChart /> : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
                                <div className="bg-slate-800/50 p-3 rounded-lg"><FaCreditCard className="mx-auto text-2xl text-primary-400 mb-2"/><p className="text-sm text-slate-400">Total de Pagamentos</p><p className="text-xl font-bold text-slate-100">{paymentReportData.kpis.totalPaymentsCount}</p></div>
                                <div className="bg-slate-800/50 p-3 rounded-lg"><FaCalculator className="mx-auto text-2xl text-primary-400 mb-2"/><p className="text-sm text-slate-400">Valor Médio</p><p className="text-xl font-bold text-slate-100">{formatCurrency(paymentReportData.kpis.averagePaymentValue)}</p></div>
                                <div className="bg-slate-800/50 p-3 rounded-lg"><FaStar className="mx-auto text-2xl text-primary-400 mb-2"/><p className="text-sm text-slate-400">Método Preferido</p><p className="text-xl font-bold text-slate-100">{paymentReportData.kpis.mostUsedPaymentMethod}</p></div>
                            </div>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={paymentReportData.monthlyPaymentChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                                    <YAxis tickFormatter={(value) => formatCurrency(Number(value))} tick={{ fill: '#94a3b8' }}/>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/>
                                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                                    <Bar dataKey="Pagamentos" name="Pagamentos" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </ReportCard>

                <ReportCard title="Distribuição de Receita por Plano">
                     {isLoading || !reportData ? <SkeletonLineChart isPie={true} /> : (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={reportData.revenueByPlan} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }: any) => `${(percent * 100).toFixed(0)}%`}>
                                {reportData.revenueByPlan.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `${formatCurrency(value)}`} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/>
                            <Legend wrapperStyle={{ color: '#94a3b8' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                     )}
                </ReportCard>
            </div>
        </>
    );
};

export default Reports;