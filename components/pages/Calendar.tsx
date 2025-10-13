import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar, Views, NavigateAction } from 'react-big-calendar';
import { dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, registerPayment } from '../../services/mockApi';
import { Invoice, InvoiceStatus, PaymentMethod, Member } from '../../types';
import { formatCurrency } from '../../lib/utils';
import PaymentModal from '../shared/PaymentModal';
import { useToast } from '../../contexts/ToastContext';
import PageLoader from '../shared/skeletons/PageLoader';
import { FaTimes, FaUser, FaFileInvoiceDollar, FaCalendarCheck, FaFilter, FaChevronLeft, FaChevronRight, FaDotCircle, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

// Setup date-fns localizer
const locales = {
  'pt-BR': ptBR,
};
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// --- Custom Components for the Calendar ---

// Custom Event Style
const CustomEvent = ({ event }: { event: any }) => {
    const status = event.resource.status as InvoiceStatus;
    const statusInfo: { [key in InvoiceStatus]: { style: string, icon: React.ReactNode } } = {
        [InvoiceStatus.PAGA]: { style: 'bg-green-500/20 text-green-300 border-green-500', icon: <FaCheckCircle /> },
        [InvoiceStatus.ATRASADA]: { style: 'bg-red-500/20 text-red-300 border-red-500', icon: <FaExclamationTriangle /> },
        [InvoiceStatus.ABERTA]: { style: 'bg-blue-500/20 text-blue-300 border-blue-500', icon: <FaFileInvoiceDollar /> },
        [InvoiceStatus.PARCIALMENTE_PAGA]: { style: 'bg-yellow-500/20 text-yellow-300 border-yellow-500', icon: <FaDotCircle /> },
        [InvoiceStatus.CANCELADA]: { style: 'bg-gray-500/20 text-gray-400 border-gray-500 line-through', icon: <FaTimes /> },
    };
    
    const info = statusInfo[status] || { style: 'bg-slate-600 border-slate-400', icon: <FaDotCircle /> };

    return (
        <div className={`flex items-center text-xs p-1 rounded-md border-l-4 gap-1.5 ${info.style}`}>
            <span className="flex-shrink-0">{info.icon}</span>
            <span className="font-semibold truncate">{event.title}</span>
        </div>
    );
};


// Custom Toolbar with Filters
const CustomToolbar = ({
    label,
    onNavigate,
    onView,
    view,
    statusFilters,
    setStatusFilters,
}: {
    label: string;
    onNavigate: (action: NavigateAction) => void;
    onView: (view: any) => void;
    view: string;
    statusFilters: InvoiceStatus[];
    setStatusFilters: React.Dispatch<React.SetStateAction<InvoiceStatus[]>>;
}) => {
    const filterOptions = [
        { value: InvoiceStatus.ABERTA, label: 'Aberta' },
        { value: InvoiceStatus.ATRASADA, label: 'Atrasada' },
        { value: InvoiceStatus.PAGA, label: 'Paga' },
    ];

    const toggleFilter = (status: InvoiceStatus) => {
        setStatusFilters(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };
    
    const viewOptions = {
        month: 'Mês',
        week: 'Semana',
        day: 'Dia',
        agenda: 'Agenda'
    };

    return (
        <div className="rbc-toolbar p-3 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <button type="button" onClick={() => onNavigate('PREV')} className="p-2 rounded-full hover:bg-slate-700"><FaChevronLeft /></button>
                <h2 className="text-xl font-bold text-slate-100 whitespace-nowrap">{label}</h2>
                <button type="button" onClick={() => onNavigate('NEXT')} className="p-2 rounded-full hover:bg-slate-700"><FaChevronRight /></button>
                <button type="button" onClick={() => onNavigate('TODAY')} className="text-sm font-semibold bg-primary-600 text-white px-4 py-1.5 rounded-md hover:bg-primary-700">Hoje</button>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-center">
                <FaFilter className="text-slate-400" />
                {filterOptions.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => toggleFilter(opt.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                            statusFilters.includes(opt.value)
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <div className="hidden md:flex items-center bg-slate-700 rounded-md p-1">
                {(Object.keys(viewOptions) as Array<keyof typeof viewOptions>).map(key => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onView(key)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${view === key ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
                    >
                        {viewOptions[key]}
                    </button>
                ))}
            </div>
        </div>
    );
};


// Main Component
const CalendarPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [statusFilters, setStatusFilters] = useState<InvoiceStatus[]>([InvoiceStatus.ABERTA, InvoiceStatus.ATRASADA]);
    const [view, setView] = useState<any>(Views.MONTH);

    // Set default view based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setView(Views.AGENDA);
            } else {
                setView(Views.MONTH);
            }
        };
        handleResize(); // Set initial view
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


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
    
    const filteredEvents = useMemo(() => {
        return invoices
            .filter(invoice => statusFilters.length === 0 || statusFilters.includes(invoice.status))
            .map(invoice => ({
                id: invoice.id,
                title: `${(invoice.member as Member).nome.split(' ')[0]} - ${formatCurrency(invoice.valor)}`,
                start: new Date(invoice.vencimento),
                end: new Date(invoice.vencimento),
                allDay: true,
                resource: invoice,
            }));
    }, [invoices, statusFilters]);
    
    const handleSelectEvent = useCallback((event: any) => {
        setSelectedInvoice(event.resource);
        setIsDetailsModalOpen(true);
    }, []);

    const handleOpenPaymentFromDetails = useCallback(() => {
        if (selectedInvoice) {
            setIsDetailsModalOpen(false);
            setIsPaymentModalOpen(true);
        }
    }, [selectedInvoice]);
    
    const handleSavePayment = async (paymentData: { valor: number, data: Date, metodo: PaymentMethod, notas?: string }) => {
        if (!selectedInvoice) return;
        paymentMutation.mutate({ invoiceId: selectedInvoice.id, ...paymentData });
    };

    if (isLoading) return <PageLoader />;
    
    const messages = {
        next: "Próximo", previous: "Anterior", today: "Hoje", month: "Mês", week: "Semana", day: "Dia",
        agenda: "Agenda", date: "Data", time: "Hora", event: "Evento", noEventsInRange: "Não há vencimentos neste período.",
        showMore: (total: number) => `+ Ver mais (${total})`
    };

    return (
        <div className="bg-card rounded-lg border border-slate-700 shadow-sm" style={{ height: 'calc(100vh - 90px)' }}>
            <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                culture='pt-BR'
                messages={messages}
                components={{
                    toolbar: (props) => (
                        <CustomToolbar {...props} statusFilters