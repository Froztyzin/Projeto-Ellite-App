import React, { useState, useMemo } from 'react';
import { Calendar } from 'react-big-calendar';
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, registerPayment } from '../../services/api/invoices';
import { Invoice, InvoiceStatus, PaymentMethod } from '../../types';
import { formatCurrency } from '../../lib/utils';
import PaymentModal from '../shared/PaymentModal';
import { useToast } from '../../contexts/ToastContext';
import PageLoader from '../shared/skeletons/PageLoader';
import { FaTimes, FaUser, FaFileInvoiceDollar, FaCalendarCheck } from 'react-icons/fa';

const locales = {
  'pt-BR': ptBR,
};
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CalendarPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
      queryKey: ['invoices'],
      queryFn: getInvoices,
    });
    
    const paymentMutation = useMutation({
        mutationFn: (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }) => registerPayment(paymentData),
        onSuccess: () => {
            addToast('Pagamento registrado com sucesso!', 'success');
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setIsPaymentModalOpen(false);
            setIsDetailsModalOpen(false);
            setSelectedInvoice(null);
        },
        onError: () => addToast('Falha ao registrar pagamento.', 'error'),
    });

    const events = useMemo(() => invoices.map(invoice => ({
        id: invoice.id,
        title: `${invoice.member.nome} - ${formatCurrency(invoice.valor)}`,
        start: new Date(invoice.vencimento),
        end: new Date(invoice.vencimento),
        allDay: true,
        resource: invoice,
    })), [invoices]);
    
    const handleSelectEvent = (event: any) => {
        setSelectedInvoice(event.resource);
        setIsDetailsModalOpen(true);
    };

    const handleOpenPaymentFromDetails = () => {
        if (selectedInvoice) {
            setIsDetailsModalOpen(false);
            setIsPaymentModalOpen(true);
        }
    };
    
    const handleSavePayment = async (paymentData: { valor: number, data: Date, metodo: PaymentMethod, notas?: string }) => {
        if (!selectedInvoice) return;
        paymentMutation.mutate({ invoiceId: selectedInvoice.id, ...paymentData });
    };

    if (isLoading) return <PageLoader />;

    return (
        <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm" style={{ height: 'calc(100vh - 120px)' }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Calendário de Vencimentos</h1>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 'calc(100% - 70px)' }}
                culture='pt-BR'
                messages={{
                    next: "Próximo", previous: "Anterior", today: "Hoje", month: "Mês", week: "Semana", day: "Dia",
                    agenda: "Agenda", date: "Data", time: "Hora", event: "Evento", noEventsInRange: "Não há eventos neste período.",
                    showMore: total => `+ Ver mais (${total})`
                }}
                eventPropGetter={(event) => {
                    const statusClass = `rbc-event-${event.resource.status.toLowerCase().replace(/_/g, '-')}`;
                    return { className: statusClass };
                }}
                onSelectEvent={handleSelectEvent}
            />

            {isDetailsModalOpen && selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700">
                            <h3 className="text-xl font-semibold text-slate-100 flex items-center"><FaFileInvoiceDollar className="mr-3 text-primary-500" /> Detalhes da Fatura</h3>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-100 p-1.5 rounded-full"><FaTimes /></button>
                        </div>
                        <div className="p-5 space-y-3 text-sm text-slate-200">
                             <p className="flex items-center"><FaUser className="mr-3 text-slate-400 w-4" /><strong className="text-slate-400 w-24 inline-block">Aluno:</strong> {selectedInvoice.member.nome}</p>
                             <p className="flex items-center"><FaFileInvoiceDollar className="mr-3 text-slate-400 w-4" /><strong className="text-slate-400 w-24 inline-block">Valor:</strong> {formatCurrency(selectedInvoice.valor)}</p>
                             <p className="flex items-center"><FaCalendarCheck className="mr-3 text-slate-400 w-4" /><strong className="text-slate-400 w-24 inline-block">Vencimento:</strong> {new Date(selectedInvoice.vencimento).toLocaleDateString('pt-BR')}</p>
                             <p className="flex items-center"><span className="w-4 mr-3"></span><strong className="text-slate-400 w-24 inline-block">Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                selectedInvoice.status === InvoiceStatus.PAGA ? 'bg-green-500/20 text-green-300' :
                                selectedInvoice.status === InvoiceStatus.ATRASADA ? 'bg-red-500/20 text-red-300' :
                                selectedInvoice.status === InvoiceStatus.PARCIALMENTE_PAGA ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-blue-500/20 text-blue-300'
                            }`}>{selectedInvoice.status}</span></p>
                        </div>
                        <div className="p-4 bg-slate-900/50 flex justify-end items-center gap-4">
                            {![InvoiceStatus.PAGA, InvoiceStatus.CANCELADA].includes(selectedInvoice.status) && (
                                <button onClick={handleOpenPaymentFromDetails} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded">
                                    Registrar Pagamento
                                </button>
                            )}
                             <button onClick={() => setIsDetailsModalOpen(false)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSave={handleSavePayment}
                invoice={selectedInvoice}
                isSaving={paymentMutation.isPending}
            />
        </div>
    );
};

export default CalendarPage;
