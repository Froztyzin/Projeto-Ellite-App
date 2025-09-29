import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotificationsForStudent } from '../../../services/mockApi';
import { Notification, NotificationChannel, NotificationType } from '../../../types';
import { formatDate } from '../../../lib/utils';
import { FaBell, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import SkeletonTable from '../../shared/skeletons/SkeletonTable';
import EmptyState from '../../shared/EmptyState';

interface StudentNotificationsProps {
    studentId: string;
}

const StudentNotifications: React.FC<StudentNotificationsProps> = ({ studentId }) => {
    const { data: notifications = [], isLoading } = useQuery({
      queryKey: ['studentNotifications', studentId],
      queryFn: () => getNotificationsForStudent(studentId),
      enabled: !!studentId,
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
        // Fix: Sort notifications by date
        return Object.values(groups).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
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
                                        <p className="font-semibold text-slate-100">{getNotificationMessage(notification)}</p>
                                        <span className="text-xs text-slate-400">{formatDate(new Date(notification.sentAt))}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            title="Nenhuma notificação"
                            message="Você não tem nenhuma notificação no momento."
                            icon={<FaBell />}
                        />
                    )
                )}
            </div>
        </div>
    );
};

export default StudentNotifications;