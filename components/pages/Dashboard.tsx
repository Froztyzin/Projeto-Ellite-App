import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboardData } from '../../services/api/dashboard';
import { formatCurrency, formatDate } from '../../lib/utils';
import { 
    FaDollarSign, FaFileInvoiceDollar, FaUserPlus, FaExclamationTriangle, FaChartLine, FaArrowUp, FaArrowDown, 
    FaUserClock, FaHistory, FaCheckCircle, FaUsers, FaArrowRight, FaTimes
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { getInvoices } from '../../services/api/invoices';
import { getExpenses } from '../../services/api/expenses';


const KpiCard: React.FC<{
  title: string;
  value: string | number;
  // Fix: Specify that the icon element can receive a className prop to resolve cloneElement type error.
  icon: React.ReactElement<{ className?: string }>;
  change?: number;
  changeTypeInverted?: boolean; // e.g. for expenses, a positive change is bad
}> = ({ title, value, icon, change, changeTypeInverted = false }) => {
    const isPositive = change !== undefined && change >= 0;
    const isNegative = change !== undefined && change < 0;
    
    let changeColor = '';
    if ((isPositive && !changeTypeInverted) || (isNegative && changeTypeInverted)) {
        changeColor = 'text-green-500';
    } else if ((isNegative && !changeTypeInverted) || (isPositive && changeTypeInverted)) {
        changeColor = 'text-red-500';
    } else {
         changeColor = 'text-slate-400';
    }

    return (
        <div className="rounded-lg border border-slate-700 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <p className="text-2xl font-bold text-slate-100">{value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-900 text-primary-400">
                    {React.cloneElement(icon, { className: 'h-6 w-6' })}
                </div>
            </div>
            {change !== undefined && (
                <div className={`mt-3 flex items-center text-sm ${changeColor}`}>
                    {isPositive ? <FaArrowUp className="h-4 w-4 mr-1"/> : <FaArrowDown className="h-4 w-4 mr-1"/>}
                    <span>{Math.abs(change).toFixed(1)}% vs. mês anterior</span>
                </div>
            )}
        </div>
    );
};


const Dashboard: React.FC = () => {
    const { data, isLoading, error } = useQuery({
      queryKey: ['dashboardData'],
      queryFn: getDashboardData
    });
    
    const [modalData, setModalData] = useState<{ month: string; revenues: any[]; expenses: any[] } | null>(null);

    const { data: allInvoices } = useQuery({ queryKey: ['invoices'], queryFn: getInvoices, enabled: !isLoading });
    const { data: allExpenses } = useQuery({ queryKey: ['expenses'], queryFn: getExpenses, enabled: !isLoading });

    const handleBarClick = (data: any) => {
        if (!data || !data.activePayload || !data.activePayload[0] || !allInvoices || !allExpenses) return;

        const payload = data.activePayload[0].payload;
        const { month, year, name } = payload;
        
        const monthRevenues = allInvoices
            .filter(i => i.payments && i.payments.length > 0)
            .flatMap(i => i.payments!.map(p => ({ ...p, memberName: i.member.nome })))
            .filter(p => {
                const pDate = new Date(p.data);
                return pDate.getFullYear() === year && pDate.getMonth() === month;
            })
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

        const monthExpenses = allExpenses
            .filter(e => {
                const eDate = new Date(e.data);
                return eDate.getFullYear() === year && eDate.getMonth() === month;
            })
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

        setModalData({ month: name, revenues: monthRevenues, expenses: monthExpenses });
    };

    if (error) {
        return <div className="text-center p-10 text-red-500">Falha ao carregar os dados do dashboard.</div>
    }

    const renderSkeletons = () => (
        <>
            {/* KPI Skeletons */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                     <div key={i} className="rounded-lg border border-slate-700 bg-card p-5 shadow-sm animate-pulse">
                        <div className="h-4 bg-slate-700 rounded w-3/4 mb-3"></div>
                        <div className="h-7 bg-slate-600 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/2 mt-3"></div>
                    </div>
                ))}
            </div>
            
            <div className="mt-6 space-y-6">
                 {/* Goal Skeleton */}
                <div className="rounded-lg border border-slate-700 bg-card p-5 shadow-sm animate-pulse">
                    <div className="h-5 bg-slate-700 rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-slate-600 rounded"></div>
                </div>
                {/* Chart Skeleton */}
                <div className="rounded-lg border border-slate-700 bg-card p-4 sm:p-6 shadow-sm animate-pulse h-[350px]"></div>
                {/* Lists Skeleton */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="rounded-lg border border-slate-700 bg-card p-5 shadow-sm animate-pulse h-80"></div>
                    <div className="rounded-lg border border-slate-700 bg-card p-5 shadow-sm animate-pulse h-80"></div>
                </div>
            </div>
        </>
    );

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Dashboard Geral</h1>
      
      {isLoading || !data ? renderSkeletons() : (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <KpiCard title="Receita do Mês" value={formatCurrency(data.kpis.receitaMes)} icon={<FaDollarSign />} change={data.kpis.receitaChange} />
                <KpiCard title="Despesas do Mês" value={formatCurrency(data.kpis.despesasMes)} icon={<FaFileInvoiceDollar />} change={data.kpis.despesasChange} changeTypeInverted />
                <KpiCard title="Lucro Líquido (Mês)" value={formatCurrency(data.kpis.lucroLiquido)} icon={<FaChartLine />} change={data.kpis.lucroChange} />
                <KpiCard title="Novos Alunos (Mês)" value={data.kpis.novosAlunosMes.toString()} icon={<FaUserPlus />} change={data.kpis.novosAlunosChange} />
                <KpiCard title="Faturas Vencendo (7d)" value={data.kpis.faturasVencendo.toString()} icon={<FaExclamationTriangle />} />
            </div>

            {/* Monthly Goal */}
            <div className="rounded-lg border border-slate-700 bg-card p-5 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-md font-semibold text-slate-100">Meta de Receita Mensal</h2>
                    <span className="text-sm font-bold text-primary-400">{((data.monthlyGoal.current / data.monthlyGoal.target) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4">
                    <div className="bg-primary-600 h-4 rounded-full" style={{ width: `${Math.min((data.monthlyGoal.current / data.monthlyGoal.target) * 100, 100)}%` }}></div>
                </div>
                 <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{formatCurrency(data.monthlyGoal.current)}</span>
                    <span>{formatCurrency(data.monthlyGoal.target)}</span>
                </div>
            </div>

            {/* Main Chart and Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 rounded-lg border border-slate-700 bg-card p-4 sm:p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-100 mb-4">Fluxo de Caixa (Últimos 6 Meses)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.cashFlowData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} onClick={handleBarClick} className="cursor-pointer">
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                            <YAxis tickFormatter={(value) => formatCurrency(Number(value))} tick={{ fill: '#94a3b8' }} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            <Bar dataKey="Receita" fill="#10b981" />
                            <Bar dataKey="Despesa" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                
                 <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="rounded-lg border border-slate-700 bg-card p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">Atividade Recente</h2>
                        <ul className="space-y-3">
                            {data.recentActivity.map((item: any) => (
                                <li key={item.id} className="flex items-center text-sm">
                                    <div className={`flex h-8 w-8 mr-3 items-center justify-center rounded-full ${item.type === 'payment' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'}`}>
                                        {item.type === 'payment' ? <FaDollarSign /> : <FaUserPlus />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-200">
                                            {item.type === 'payment' ? `Pagamento de ${formatCurrency(item.valor)} recebido de` : 'Novo aluno:'} <span className="font-semibold">{item.memberName}</span>
                                        </p>
                                        <p className="text-xs text-slate-400">{new Date(item.data).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* At Risk Members */}
                    <div className="rounded-lg border border-slate-700 bg-card p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">Alunos em Risco</h2>
                         <ul className="space-y-3">
                            {data.atRiskMembers.map((member: any) => (
                                <li key={member.id} className="flex items-center text-sm">
                                    <div className={`flex h-8 w-8 mr-3 items-center justify-center rounded-full ${member.reason === 'Fatura Atrasada' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                        <FaUserClock />
                                    </div>
                                    <div className="flex-1">
                                        <Link to={`/members/${member.id}`} className="font-semibold text-slate-200 hover:underline">{member.nome}</Link>
                                        <p className="text-xs text-slate-400">{member.reason} <span className="font-medium">({member.details})</span></p>
                                    </div>
                                    <Link to={`/members/${member.id}`} className="p-2 rounded-full text-slate-400 hover:bg-slate-700">
                                        <FaArrowRight />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                         {data.atRiskMembers.length === 0 && (
                            <div className="text-center py-8">
                                <FaCheckCircle className="mx-auto text-4xl text-green-500 mb-3" />
                                <p className="font-semibold text-slate-200">Nenhum aluno em risco!</p>
                                <p className="text-sm text-slate-400">Ótimo trabalho mantendo todos em dia.</p>
                            </div>
                         )}
                    </div>
                 </div>
            </div>
        </div>
      )}
       {modalData && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
              <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b border-slate-700">
                      <h3 className="text-xl font-semibold text-slate-100">Detalhes de {modalData.month}</h3>
                      <button onClick={() => setModalData(null)} className="text-slate-400 p-1.5 rounded-full hover:bg-slate-600">
                          <FaTimes />
                      </button>
                  </div>
                  <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {/* Revenue list */}
                      <div>
                          <h4 className="font-semibold text-lg text-green-400 mb-3 sticky top-0 bg-slate-800 py-2">Receitas ({formatCurrency(modalData.revenues.reduce((s, i) => s + i.valor, 0))})</h4>
                          <ul className="space-y-3 text-sm">
                              {modalData.revenues.length > 0 ? modalData.revenues.map(item => (
                                  <li key={item.id} className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                                      <div>
                                          <p className="text-slate-200 font-medium">{item.memberName}</p>
                                          <p className="text-xs text-slate-400">{formatDate(new Date(item.data))}</p>
                                      </div>
                                      <span className="font-semibold text-green-400">{formatCurrency(item.valor)}</span>
                                  </li>
                              )) : <p className="text-slate-400">Nenhuma receita neste mês.</p>}
                          </ul>
                      </div>
                      {/* Expense list */}
                      <div>
                          <h4 className="font-semibold text-lg text-red-400 mb-3 sticky top-0 bg-slate-800 py-2">Despesas ({formatCurrency(modalData.expenses.reduce((s, i) => s + i.valor, 0))})</h4>
                          <ul className="space-y-3 text-sm">
                              {modalData.expenses.length > 0 ? modalData.expenses.map(item => (
                                  <li key={item.id} className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                                      <div>
                                          <p className="text-slate-200 font-medium">{item.descricao}</p>
                                          <p className="text-xs text-slate-400">{formatDate(new Date(item.data))}</p>
                                      </div>
                                      <span className="font-semibold text-red-400">{formatCurrency(item.valor)}</span>
                                  </li>
                              )) : <p className="text-slate-400">Nenhuma despesa neste mês.</p>}
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default Dashboard;