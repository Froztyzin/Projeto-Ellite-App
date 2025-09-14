import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { getNotificationsForStudent } from '../../../services/api/notifications';
import { Notification, NotificationChannel } from '../../../types';
import { formatDate, getNotificationTypeBadge } from '../../../lib/utils';
import { FaEnvelope, FaWhatsapp, FaBell } from 'react-icons/fa';
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


    return (
        <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6 flex items-center">
                <FaBell className="mr-4 text-primary-500" /> Minhas Notificações
            </h1>
            
            {isLoading ? <SkeletonTable headers={['Data', 'Mensagem', 'Tipo']} /> : (
                groupedNotifications.length > 0 ? (
                    <div className="space-y-3">
                        {groupedNotifications.map((notification) => (
                            <div key={notification.id} className="bg-slate-800 p-4 rounded-lg border-l-4 border-slate-600 flex items-start gap-4">
                                <div className="flex-shrink-0 pt-1">
                                    {getNotificationTypeBadge(notification.type)}
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-200">{getNotificationMessage(notification)}</p>
                                    <p className="text-sm text-slate-400">Enviada em: {formatDate(new Date(notification.sentAt))}</p>
                                </div>
                                <div className="flex-shrink-0 text-lg flex items-center gap-3 pt-1" title="Enviado por E-mail e WhatsApp">
                                    <FaEnvelope className="text-slate-400" />
                                    <FaWhatsapp className="text-green-500" />
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
    );
};

export default StudentNotifications;
