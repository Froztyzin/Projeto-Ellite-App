import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStudentProfileData } from '../../services/mockApi';
import { InvoiceStatus } from '../../../types';
import { formatCurrency, formatDateOnly } from '../../../lib/utils';
import { FaCheckCircle, FaExclamationCircle, FaFileInvoiceDollar, FaArrowRight, FaIdCard, FaHistory } from 'react-icons/fa';
import PageLoader from '../../shared/skeletons/PageLoader';

const InfoCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactElement;
  linkTo?: string;
  bgColor?: string;
}> = ({ title, value, icon, linkTo, bgColor = 'bg-slate-800/50' }) => (
    <div className={`p-4 rounded-lg border border-slate-700 ${bgColor} flex items-center justify-between`}>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-xl font-bold text-slate-100">{value}</p>
        </div>
        <div className="flex items-center">
            <div className="text-2xl text-primary-400 mr-4">{icon}</div>
            {linkTo && (
                <Link to={linkTo} className="p-2 rounded-full text-slate-400 hover:bg-slate-700">
                    <FaArrowRight />
                </Link>
            )}
        </div>
    </div>
);

interface StudentDashboardProps {
    studentId: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentId }) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['studentProfile', studentId],
        queryFn: () => {
            if (!studentId) throw new Error("ID do aluno não fornecido");
            return getStudentProfileData(studentId);
        },
        enabled: !!studentId,
    });

    const summary = useMemo(() => {
        if (!data) return null;

        const nextInvoice = data.invoices
            .filter(inv => [InvoiceStatus.ABERTA, InvoiceStatus.PARCIALMENTE_PAGA].includes(inv.status))
            .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime())[0];

        const overdueInvoices = data.invoices.filter(inv => inv.status === InvoiceStatus.ATRASADA);
        
        const calculateRemaining = (inv: any) => inv.valor - (inv.payments?.reduce((s: any, p: any) => s + p.valor, 0) || 0);
        
        return {
            planName: data.plan?.nome || 'Nenhum plano ativo',
            status: data.enrollment?.status || 'Inativo',
            nextDueDate: nextInvoice ? formatDateOnly(new Date(nextInvoice.vencimento)) : 'N/A',
            nextDueValue: nextInvoice ? formatCurrency(calculateRemaining(nextInvoice)) : 'N/A',
            hasOverdue: overdueInvoices.length > 0,
            overdueCount: overdueInvoices.length,
        };
    }, [data]);

    if (isLoading) return <PageLoader />;
    if (error) return <div className="text-center p-10 text-red-500">Falha ao carregar os dados. Tente novamente mais tarde.</div>;
    if (!data || !summary) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-100">Bem-vindo(a), {data.member.nome.split(' ')[0]}!</h1>
            
            {summary.hasOverdue ? (
                <div className="bg-red-900/50 border border-red-500/50 p-4 rounded-lg flex items-center gap-4">
                    <FaExclamationCircle className="text-3xl text-red-400 flex-shrink-0" />
                    <div>
                        <h2 className="font-bold text-red-300">Atenção! Você possui {summary.overdueCount} {summary.overdueCount > 1 ? 'faturas atrasadas' : 'fatura atrasada'}.</h2>
                        <p className="text-sm text-red-300">Regularize sua situação para continuar treinando. <Link to="/portal/invoices" className="font-semibold underline hover:text-white">Ver faturas</Link></p>
                    </div>
                </div>
            ) : (
                 <div className="bg-green-900/50 border border-green-500/50 p-4 rounded-lg flex items-center gap-4">
                    <FaCheckCircle className="text-3xl text-green-400 flex-shrink-0" />
                    <div>
                        <h2 className="font-bold text-green-300">Tudo em dia!</h2>
                        <p className="text-sm text-green-300">Suas finanças estão em ordem. Bom treino!</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 bg-card p-6 rounded-lg border border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <p className="text-sm text-slate-400">Seu Plano Atual</p>
                        <p className="text-2xl font-bold text-primary-400">{summary.planName}</p>
                    </div>
                    <div className="text-center sm:text-right">
                         <p className="text-sm text-slate-400">Status da Matrícula</p>
                         <p className={`text-xl font-bold ${data.member.ativo ? 'text-green-400' : 'text-red-400'}`}>{summary.status}</p>
                    </div>
                </div>

                <InfoCard 
                    title="Próximo Vencimento"
                    value={summary.nextDueDate}
                    icon={<FaFileInvoiceDollar />}
                    linkTo="/portal/invoices"
                />

                <InfoCard 
                    title="Valor da Próxima Fatura"
                    value={summary.nextDueValue}
                    icon={<FaFileInvoiceDollar />}
                    linkTo="/portal/invoices"
                />
            </div>
            
            <div className="bg-card p-6 rounded-lg border border-slate-700">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">Acesso Rápido</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Link to="/portal/invoices" className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors">
                        <FaHistory className="text-2xl text-primary-400" />
                        <div>
                            <p className="font-semibold text-slate-100">Histórico Financeiro</p>
                            <p className="text-xs text-slate-400">Veja todas as suas faturas.</p>
                        </div>
                    </Link>
                     <Link to="/portal/profile" className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors">
                        <FaIdCard className="text-2xl text-primary-400" />
                        <div>
                            <p className="font-semibold text-slate-100">Meus Dados</p>
                            <p className="text-xs text-slate-400">Atualize suas informações.</p>
                        </div>
                    </Link>
                </div>
            </div>

        </div>
    );
};

export default StudentDashboard;
