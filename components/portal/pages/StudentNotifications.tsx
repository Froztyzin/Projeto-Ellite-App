import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { getNotificationsForStudent } from '../../../services/api/notifications';
import { Notification, NotificationChannel, NotificationType } from '../../../types';
import { formatDate, getNotificationTypeBadge } from '../../../lib/utils';
import { FaEnvelope, FaWhatsapp, FaBell, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import SkeletonTable from '../../shared/skeletons/SkeletonTable';
import EmptyState from '../../shared/EmptyState';

const StudentNotifications: React.FC = () => {
    const { user } = useAuth();

    const { data: notifications = [], isLoading } = useQuery({
      queryKey: ['studentNotifications', user?.id],
      queryFn: () => getNotificationsForStudent(user!.id),
      enabled: !!user,
    });

    useEffect(() => {
        // When the user visits this page, update the timestamp to mark notifications as "read"
        localStorage.setItem('lastStudentNotificationView', new Date().toISOString());
    }, []);
    
    const getNotificationMessage = (notification: Notification) => {
        switch (notification.type) {
            case 'LEMBRETE_VENCIMENTO':
                return `Lembrete: Sua fatura de competência ${notification.invoice.competencia} vence em breve.`;
            case 'ALERTA_ATRASO':
                return `Atenção: A fatura de competência ${notification.invoice.competencia} está atrasada.`;
            default:
                return 'Nova notificação.';
        }
    }
    
    const groupedNotifications = useMemo(() => {
        if (!notifications) return [];
        const groups: { [key: string]: Notification } = {};
        notifications.forEach(n => {
            // Group by invoice and type to show one card per notification event
            const key = `${n.invoice.id}-${n.type}`;
            if (!groups[key]) {
                groups[key] = n;
            }
        });
        return Object.values(groups);
    }, [notifications]);

    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.ALERTA_ATRASO:
                return <FaExclamationTriangle className="text-red-400 text-xl" />;
            case NotificationType.LEMBRETE_VENCIMENTO:
                return <FaInfoCircle className="text-blue-400 text-xl" />;
            default:
                return <FaBell className="text-slate-400 text-xl" />;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-100">Minhas Notificações</h1>
            
            <div className="bg-card p-6 rounded-lg border border-slate-700 shadow-sm">
                {isLoading ? <SkeletonTable headers={['Data', 'Mensagem', 'Tipo']} /> : (
                    groupedNotifications.length > 0 ? (
                        <div className="space-y-4">
                            {groupedNotifications.map((notification) => (
                                <div key={notification.id} className="bg-slate-800/50 p-4 rounded-lg flex items-start gap-4">
                                    <div className="flex-shrink-0 pt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-200">{getNotificationMessage(notification)}</p>
                                        <p className="text-sm text-slate-400">
                                            Enviada em: {formatDate(new Date(notification.sentAt))}
                                            <span className="inline-flex items-center gap-2 ml-3" title="Enviado por E-mail e WhatsApp">
                                                <FaEnvelope className="text-slate-500" />
                                                <FaWhatsapp className="text-slate-500" />
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            title="Nenhuma notificação"
                            message="Sua caixa de entrada está limpa. Avisaremos quando houver algo novo."
                            icon={<FaBell />}
                        />
                    )
                )}
            </div>
        </div>
    );
};

export default StudentNotifications;
