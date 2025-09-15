import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { getStudentProfileData } from '../../../services/api/members';
import { InvoiceStatus, Payment } from '../../../types';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { FaDumbbell, FaCheckCircle, FaExclamationCircle, FaFileInvoiceDollar, FaArrowRight, FaIdCard, FaHistory, FaBell } from 'react-icons/fa';
import SkeletonCard from '../../shared/skeletons/SkeletonCard';

const InfoCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactElement, className?: string }> = ({ title, children, icon, className }) => (
    <div className={`bg-card p-6 rounded-lg border border-slate-700 shadow-sm flex flex-col ${className}`}>
        <div className="flex items-center mb-4">
            <div className="text-primary-500 mr-4 text-2xl">{icon}</div>
            <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
        </div>
        <div className="text-slate-300 flex-grow flex flex-col justify-center">{children}</div>
    </div>
);


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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-400 text-center p-8 bg-card rounded-lg">Erro ao carregar seus dados. Tente novamente mais tarde.</div>;
    }
    
    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Bem-vindo, {member?.nome.split(' ')[0]}!</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Next Invoice Card */}
                <InfoCard title="Próxima Fatura" icon={<FaFileInvoiceDollar />} className="row-span-1 md:col-span-1">
                    {nextInvoice ? (
                        <div className="space-y-3">
                             <p className={`text-3xl font-bold ${nextInvoice.status === InvoiceStatus.ATRASADA ? 'text-red-400' : 'text-yellow-400'}`}>
                                {formatCurrency(nextInvoice.valor)}
                            </p>
                            <p className="text-sm">Vencimento: <span className="font-semibold">{formatDate(new Date(nextInvoice.vencimento))}</span></p>
                            <Link to="/portal/invoices" className="inline-block w-full text-center bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold mt-4">
                                Pagar Agora
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center py-4">
                            <FaCheckCircle className="text-5xl text-green-500 mb-3"/>
                            <p className="font-semibold text-lg">Tudo em dia!</p>
                            <p className="text-sm text-slate-400">Você não possui faturas pendentes.</p>
                        </div>
                    )}
                </InfoCard>

                {/* Plan Details Card */}
                <InfoCard title="Meu Plano" icon={<FaDumbbell />} className="row-span-1 md:col-span-1">
                    {enrollment ? (
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-primary-400">{enrollment.plan.nome}</p>
                            <p className="text-sm">Valor: <span className="font-semibold">{formatCurrency(enrollment.plan.precoBase)}</span></p>
                            <p className="text-sm">Próximo vencimento em: <span className="font-semibold">{formatDate(new Date(enrollment.fim))}</span></p>
                        </div>
                    ) : (
                        <p>Você não está matriculado em nenhum plano no momento.</p>
                    )}
                </InfoCard>

                {/* Last Payment Card */}
                <InfoCard title="Último Pagamento Realizado" icon={<FaHistory />}>
                     {lastPayment ? (
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-green-400">{formatCurrency(lastPayment.valor)}</p>
                            <p className="text-sm">Pago em: <span className="font-semibold">{formatDate(new Date(lastPayment.data))}</span></p>
                            <p className="text-sm">Método: <span className="font-semibold">{lastPayment.metodo}</span></p>
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 py-4">Nenhum pagamento registrado ainda.</p>
                    )}
                </InfoCard>


                {/* Quick Actions Card */}
                <div className="bg-card p-6 rounded-lg border border-slate-700 shadow-sm space-y-4">
                    <Link to="/portal/profile" className="flex items-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
                        <FaIdCard className="text-2xl text-primary-500 mr-4" />
                        <div>
                            <h3 className="font-semibold text-slate-100">Meu Perfil</h3>
                            <p className="text-sm text-slate-400">Ver e atualizar minhas informações</p>
                        </div>
                    </Link>
                     <Link to="/portal/invoices" className="flex items-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
                        <FaFileInvoiceDollar className="text-2xl text-primary-500 mr-4" />
                        <div>
                            <h3 className="font-semibold text-slate-100">Histórico de Faturas</h3>
                            <p className="text-sm text-slate-400">Consultar todos os meus pagamentos</p>
                        </div>
                    </Link>
                    <Link to="/portal/notifications" className="flex items-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
                        <FaBell className="text-2xl text-primary-500 mr-4" />
                        <div>
                            <h3 className="font-semibold text-slate-100">Notificações</h3>
                            <p className="text-sm text-slate-400">Ver lembretes e alertas</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;