import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotificationHistory } from '../../services/api/notifications';
import { Notification, NotificationChannel } from '../../types';
import { formatDate, getNotificationTypeBadge } from '../../lib/utils';
import { FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import SkeletonTable from '../shared/skeletons/SkeletonTable';
import EmptyState from '../shared/EmptyState';

const Notifications: React.FC = () => {
    const { data: notifications = [], isLoading } = useQuery({
      queryKey: ['notificationHistory'],
      queryFn: getNotificationHistory
    });

    useEffect(() => {
        // When the user visits this page, clear the "new" notifications count
        localStorage.setItem('lastNotificationView', new Date().toISOString());
        // This will trigger a re-render in Header to update the badge, if it were connected to this state
        // For now, it simply sets the timestamp for the next check.
    }, []);
    
    const getChannelIcon = (channel: NotificationChannel) => {
        switch (channel) {
            case NotificationChannel.EMAIL:
                return <FaEnvelope className="text-slate-400" title="Email" />;
            case NotificationChannel.WHATSAPP:
                return <FaWhatsapp className="text-green-500" title="WhatsApp" />;
            default:
                return null;
        }
    };

    return (
        <>
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 self-start">Histórico de Notificações</h1>
                </div>
                
                <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300 text-sm">
                    <p>Esta página exibe o histórico de todas as notificações enviadas aos alunos. O sistema verifica e envia lembretes de vencimento e alertas de atraso automaticamente em segundo plano.</p>
                </div>

                {isLoading ? <SkeletonTable headers={['Aluno', 'Data de Envio', 'Tipo', 'Canal', 'Status']} /> : (
                <div className="overflow-x-auto">
                    {notifications.length > 0 ? (
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Aluno</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Data de Envio</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tipo</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Canal</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-slate-700">
                           {notifications.map((notification) => (
                                <tr key={notification.id} className="hover:bg-slate-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-100">{notification.member.nome}</div>
                                        <div className="text-sm text-slate-400">Fatura: {notification.invoice.competencia}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatDate(new Date(notification.sentAt))}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getNotificationTypeBadge(notification.type)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-lg">{getChannelIcon(notification.channel)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-900/50 text-green-300">{notification.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    ) : (
                         <EmptyState 
                            title="Nenhuma notificação enviada"
                            message="O histórico aparecerá aqui quando as notificações automáticas forem enviadas."
                         />
                    )}
                </div>
                )}
            </div>
        </>
    );
};

export default Notifications;