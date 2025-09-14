import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { getStudentProfileData } from '../../../services/api/members';
import { InvoiceStatus } from '../../../types';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { FaDumbbell, FaCheckCircle, FaExclamationCircle, FaFileInvoiceDollar, FaArrowRight, FaIdCard, FaHistory } from 'react-icons/fa';
import SkeletonCard from '../../shared/skeletons/SkeletonCard';

const InfoCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactElement }> = ({ title, children, icon }) => (
    <div className="bg-card p-6 rounded-lg border border-slate-700 shadow-sm">
        <div className="flex items-center mb-4">
            <div className="text-primary-500 mr-4 text-2xl">{icon}</div>
            <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
        </div>
        <div className="text-slate-300">{children}</div>
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
    
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-400 text-center p-8 bg-card rounded-lg">Erro ao carregar seus dados. Tente novamente mais tarde.</div>;
    }

    const { member, enrollment, invoices } = data || {};
    const nextInvoice = invoices?.find(inv => inv.status === InvoiceStatus.ABERTA || inv.status === InvoiceStatus.ATRASADA);
    
    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Bem-vindo, {member?.nome.split(' ')[0]}!</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Plan Details Card */}
                <InfoCard title="Meu Plano" icon={<FaDumbbell />}>
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

                {/* Next Invoice Card */}
                <InfoCard title="Próxima Fatura" icon={<FaFileInvoiceDollar />}>
                    {nextInvoice ? (
                        <div className="space-y-2">
                             <p className={`text-2xl font-bold ${nextInvoice.status === InvoiceStatus.ATRASADA ? 'text-red-400' : 'text-yellow-400'}`}>
                                {formatCurrency(nextInvoice.valor)}
                            </p>
                            <p className="text-sm">Vencimento: <span className="font-semibold">{formatDate(new Date(nextInvoice.vencimento))}</span></p>
                            <Link to="/portal/invoices" className="inline-flex items-center text-primary-500 hover:text-primary-400 mt-3 text-sm font-semibold">
                                Ver todas as faturas <FaArrowRight className="ml-2" />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center py-4">
                            <FaCheckCircle className="text-4xl text-green-500 mb-2"/>
                            <p className="font-semibold">Tudo em dia!</p>
                            <p className="text-sm">Você não possui faturas pendentes.</p>
                        </div>
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
                        <FaHistory className="text-2xl text-primary-500 mr-4" />
                        <div>
                            <h3 className="font-semibold text-slate-100">Histórico de Faturas</h3>
                            <p className="text-sm text-slate-400">Consultar todos os meus pagamentos</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
