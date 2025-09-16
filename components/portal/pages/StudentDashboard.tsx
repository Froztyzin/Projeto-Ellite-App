import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { getStudentProfileData } from '../../../services/api/members';
import { InvoiceStatus, Payment } from '../../../types';
import { formatCurrency, formatDate, getStatusBadge } from '../../../lib/utils';
import { FaDumbbell, FaCheckCircle, FaExclamationCircle, FaFileInvoiceDollar, FaArrowRight, FaIdCard, FaHistory, FaBell } from 'react-icons/fa';
import SkeletonCard from '../../shared/skeletons/SkeletonCard';
import PageLoader from '../../shared/skeletons/PageLoader';

const StatCard: React.FC<{ label: string; value: string; }> = React.memo(({ label, value }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-100 truncate">{value}</p>
    </div>
));
StatCard.displayName = 'StatCard';


const StudentDashboard: React.FC = () => {
    const { user } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: ['studentProfile', user?.id],
        queryFn: () => {
            if (!user?.id) throw new Error("Usuário não encontrado");
            return getStudentProfileData(user.id);
        },
        enabled: !!user?.id,
    });
    
    const { member, enrollment, invoices } = data || {};
    
    const nextInvoice = useMemo(() => 
        invoices?.find(inv => inv.status === InvoiceStatus.ABERTA || inv.status === InvoiceStatus.ATRASADA), 
    [invoices]);

    const lastPayment: Payment | null = useMemo(() => {
        if (!invoices) return null;
        const allPayments = invoices
            .filter(inv => inv.status === InvoiceStatus.PAGA || inv.status === InvoiceStatus.PARCIALMENTE_PAGA)
            .flatMap(inv => inv.payments || []);
        
        if (allPayments.length === 0) return null;
        
        return allPayments.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
    }, [invoices]);

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div>
                    <div className="h-8 bg-slate-700 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-700 rounded w-3/4 mt-2"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-slate-700 h-60"></div>
                    <div className="bg-card p-6 rounded-lg border border-slate-700 h-60"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-400 text-center p-8 bg-card rounded-lg">Erro ao carregar seus dados. Tente novamente mais tarde.</div>;
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-100">Olá, {member?.nome.split(' ')[0]}!</h1>
                <p className="text-md text-slate-400 mt-1">Aqui está um resumo da sua situação na academia.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main CTA: Next Invoice */}
                <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-slate-700 shadow-lg flex flex-col justify-between">
                    {nextInvoice ? (
                        <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-200">Próxima Fatura</h2>
                                    <p className={`text-4xl font-bold mt-2 ${nextInvoice.status === InvoiceStatus.ATRASADA ? 'text-red-400' : 'text-primary-400'}`}>
                                        {formatCurrency(nextInvoice.valor)}
                                    </p>
                                </div>
                                {getStatusBadge(nextInvoice.status)}
                            </div>
                            <p className="text-sm text-slate-400 mt-1">Vencimento em: {formatDate(new Date(nextInvoice.vencimento))}</p>
                        </div>
                    ) : (
                         <div className="text-center flex-grow flex flex-col justify-center items-center">
                            <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4"/>
                            <h2 className="text-xl font-bold text-slate-100">Você está em dia!</h2>
                            <p className="text-slate-400">Nenhuma fatura pendente no momento.</p>
                        </div>
                    )}
                    <div className="mt-6">
                         {nextInvoice ? (
                            <Link to="/portal/invoices" className="w-full text-center block bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition font-semibold">
                                Ver Fatura e Pagar
                            </Link>
                         ) : (
                             <Link to="/portal/invoices" className="w-full text-center block bg-slate-600 text-white px-4 py-3 rounded-lg hover:bg-slate-500 transition font-semibold">
                                Ver Histórico de Faturas
                            </Link>
                         )}
                    </div>
                </div>

                {/* Membership Status */}
                <div className="bg-card p-6 rounded-lg border border-slate-700 shadow-lg space-y-4">
                    <h2 className="text-lg font-semibold text-slate-200 flex items-center"><FaDumbbell className="mr-3 text-primary-500"/> Matrícula</h2>
                    {enrollment ? (
                        <div className="space-y-4">
                            <StatCard label="Plano Atual" value={enrollment.plan.nome} />
                            <StatCard label="Status da Matrícula" value={enrollment.status} />
                            {lastPayment ? (
                                <StatCard label="Último Pagamento" value={`${formatCurrency(lastPayment.valor)} em ${new Date(lastPayment.data).toLocaleDateString('pt-BR')}`} />
                            ) : (
                                <StatCard label="Último Pagamento" value="Nenhum registrado" />
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-400">Você não possui uma matrícula ativa.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;