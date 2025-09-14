import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import Card from '../shared/Card';
import { getDashboardData } from '../../services/api/dashboard';
import { formatCurrency } from '../../lib/utils';
import { FaDollarSign, FaFileInvoiceDollar, FaUserCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import SkeletonCard from '../shared/skeletons/SkeletonCard';
import SkeletonLineChart from '../shared/skeletons/SkeletonLineChart';

const Dashboard: React.FC = () => {
    const { data, isLoading, error } = useQuery({
      queryKey: ['dashboardData'],
      queryFn: getDashboardData
    });

    if (error) {
        return <div className="text-center p-10 text-red-500">Falha ao carregar os dados do dashboard.</div>
    }

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <Card title="Receita do Mês" value={formatCurrency(data.kpis.receitaMes)} icon={<FaDollarSign />} />
            <Card title="Despesas do Mês" value={formatCurrency(data.kpis.despesasMes)} icon={<FaFileInvoiceDollar />} />
            <Card title="Alunos Ativos" value={data.kpis.activeMembers.toString()} icon={<FaUserCheck />} />
            <Card title="Inadimplência" value={formatCurrency(data.kpis.inadimplencia)} icon={<FaExclamationTriangle />} />
          </>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8">
        <div className="rounded-lg border border-slate-700 bg-card p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Fluxo de Caixa (Últimos 6 Meses)</h2>
          {isLoading || !data ? (
            <SkeletonLineChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.cashFlowData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                <YAxis tickFormatter={(value) => formatCurrency(Number(value))} tick={{ fill: '#94a3b8' }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Bar dataKey="Receita" fill="#10b981" />
                <Bar dataKey="Despesa" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;