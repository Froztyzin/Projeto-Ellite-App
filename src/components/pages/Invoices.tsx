import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, registerPayment, generateMonthlyInvoices, generatePaymentLink } from '../../services/api/invoices';
import { Invoice, InvoiceStatus, PaymentMethod, Role } from '../../types';
import { formatCurrency, formatDate, getStatusBadge } from '../../lib/utils';
import { FaSearch, FaRedo, FaCog, FaTimes, FaFileCsv, FaSort, FaSortUp, FaSortDown, FaLink, FaSpinner } from 'react-icons/fa';
import PaymentModal from '../shared/PaymentModal';
import PaymentLinkModal from '../shared/PaymentLinkModal';
import Papa from 'papaparse';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import useSortableData from '../../hooks/useSortableData';
import Pagination from '../shared/Pagination';
import EmptyState from '../shared/EmptyState';
import SkeletonTable from '../shared/skeletons/SkeletonTable';
import { useDebounce } from '../../hooks/useDebounce';

const ITEMS_PER_PAGE = 15;

const InvoiceRow = React.memo(({
  invoice,
  onPayClick,
  onGenerateLinkClick,
  isLinkGenerating,
}: {
  invoice: Invoice;
  onPayClick: (invoice: Invoice) => void;
  onGenerateLinkClick: (invoice: Invoice) => void;
  isLinkGenerating: boolean;
}) => {
  const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.valor, 0) || 0;
  return (
    <tr className="hover:bg-slate-700/50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-100 truncate">{invoice.member.nome}</div>
        <div className="text-sm text-slate-400 truncate">{invoice.member.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatDate(new Date(invoice.vencimento))}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-300">
        <div>{formatCurrency(invoice.valor)}</div>
        {invoice.status === InvoiceStatus.PARCIALMENTE_PAGA && (
          <div className="text-xs text-yellow-500 font-normal">Pago: {formatCurrency(totalPaid)}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-400">{getStatusBadge(invoice.status)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          {![InvoiceStatus.PAGA, InvoiceStatus.CANCELADA].includes(invoice.status) ? (
            <>
              <button
                onClick={() => onGenerateLinkClick(invoice)}
                className="text-slate-400 hover:text-primary-500 p-2 rounded-full hover:bg-slate-700/80 transition-colors"
                title="Gerar link de pagamento"
                disabled={isLinkGenerating}
              >
                {isLinkGenerating ? <FaSpinner className="animate-spin" /> : <FaLink />}
              </button>
              <button
                onClick={() => onPayClick(invoice)}
                className="bg-primary-600 text-white hover:bg-primary-700 px-3 py-1 rounded-md transition-colors"
              >
                Pagar
              </button>
            </>
          ) : (
            <span className="text-slate-500">N/A</span>
          )}
        </div>
      </td>
    </tr>
  );
});
InvoiceRow.displayName = 'InvoiceRow';


const Invoices: React.FC = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const { data: invoices = [], isLoading, isRefetching } = useQuery<Invoice[]>({
      queryKey: ['invoices'],
      queryFn: getInvoices,
    });

    const paymentMutation = useMutation({
        mutationFn: (paymentData: { invoiceId: string; valor: number; data: Date; metodo: PaymentMethod; notas?: string; }) => registerPayment(paymentData),
        onSuccess: () => {
            addToast('Pagamento registrado com sucesso!', 'success');
            
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
            queryClient.invalidateQueries({ queryKey: ['reportsData'] });
            queryClient.invalidateQueries({ queryKey: ['notificationHistory'] });

            if (selectedInvoice) {
                queryClient.invalidateQueries({ queryKey: ['studentProfile', selectedInvoice.member.id] });
            }

            setIsPaymentModalOpen(false);
            setSelectedInvoice(null);
        },
        onError: (error) => {
            console.error("Failed to save payment:", error);
            addToast('Falha ao registrar pagamento.', 'error');
        }
    });

    // Fix: Typed the useMutation hook to ensure 'result' is correctly typed in onSuccess.
    const generationMutation = useMutation<{ generatedCount: number }>({
        mutationFn: generateMonthlyInvoices,
        onSuccess: (result) => {
            if (result.generatedCount > 0) {
                addToast(`${result.generatedCount} novas faturas foram geradas com sucesso!`, 'success');
            } else {
                addToast('Nenhuma nova fatura precisava ser gerada.', 'info');
            }
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
        onError: (error) => {
            console.error("Failed to generate invoices:", error);
            addToast('Ocorreu um erro ao gerar as faturas.', 'error');
        }
    });
    
    // Fix: Typed the useMutation hook to ensure 'data' is correctly typed in onSuccess.
    const linkGenerationMutation = useMutation<{ link: string }, Error, string>({
        mutationFn: generatePaymentLink,
        onSuccess: (data) => {
            setGeneratedLink(data.link);
            setIsLinkModalOpen(true);
            addToast('Link de pagamento gerado!', 'success');
        },
        onError: (error: Error) => {
            addToast(`Erro ao gerar link: ${error.message}`, 'error');
            setSelectedInvoice(null);
        }
    });

    const handleOpenPaymentModal = useCallback((invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
    }, []);

    const handleGenerateLink = useCallback((invoice: Invoice) => {
        setSelectedInvoice(invoice);
        linkGenerationMutation.mutate(invoice.id);
    }, [linkGenerationMutation]);

    const handleSavePayment = useCallback(async (paymentData: { valor: number, data: Date, metodo: PaymentMethod, notas?: string }) => {
        if (!selectedInvoice) return;
        paymentMutation.mutate({ invoiceId: selectedInvoice.id, ...paymentData });
    }, [selectedInvoice, paymentMutation]);

    const handleGenerateInvoices = useCallback(() => {
        generationMutation.mutate();
    }, [generationMutation]);

    const filteredInvoices = useMemo(() => {
        let tempInvoices = invoices;
        
        if (filterStatus !== 'ALL') tempInvoices = tempInvoices.filter(invoice => invoice.status === filterStatus);
        if (debouncedSearchQuery) {
            const lowercasedQuery = debouncedSearchQuery.toLowerCase();
            tempInvoices = tempInvoices.filter(invoice => invoice.member.nome.toLowerCase().includes(lowercasedQuery));
        }
        if (startDate) {
            const start = new Date(startDate + 'T00:00:00');
            tempInvoices = tempInvoices.filter(invoice => new Date(invoice.vencimento) >= start);
        }
        if (endDate) {
            const end = new Date(endDate + 'T23:59:59');
            tempInvoices = tempInvoices.filter(invoice => new Date(invoice.vencimento) <= end);
        }
        return tempInvoices;
    }, [invoices, filterStatus, debouncedSearchQuery, startDate, endDate]);

    const { items: sortedItems, requestSort, sortConfig } = useSortableData(filteredInvoices, { key: 'vencimento', direction: 'descending' });
    
    const paginatedInvoices = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedItems, currentPage]);


    const handleClearFilters = useCallback(() => {
        setFilterStatus('ALL');
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    }, []);
    
    const handleExportCSV = useCallback(() => {
        const dataForCsv = sortedItems.map(invoice => {
            const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.valor, 0) || 0;
            const lastPayment = invoice.payments?.[invoice.payments.length - 1];
            return {
                'Aluno': invoice.member.nome, 'Email': invoice.member.email, 'CPF': invoice.member.cpf,
                'Competência': invoice.competencia, 'Vencimento': formatDate(new Date(invoice.vencimento)),
                'Valor Total': invoice.valor, 'Status': invoice.status, 'Valor Pago': totalPaid,
                'Data Últ. Pgto': lastPayment ? formatDate(new Date(lastPayment.data)) : '',
                'Método Últ. Pgto': lastPayment?.metodo || '',
            };
        });
        const csv = Papa.unparse(dataForCsv, { header: true });
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'faturas.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Exportação de faturas iniciada.', 'success');
    }, [sortedItems, addToast]);

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort className="inline ml-1 opacity-40" />;
        if (sortConfig.direction === 'ascending') return <FaSortUp className="inline ml-1" />;
        return <FaSortDown className="inline ml-1" />;
    };
    
    return (
        <>
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Faturas</h1>
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        {user && [Role.ADMIN, Role.FINANCEIRO].includes(user.role) && (
                            <>
                                <button onClick={handleGenerateInvoices} disabled={generationMutation.isPending} className="flex-grow sm:flex-grow-0 flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-green-400">
                                    <FaCog className={`mr-2 ${generationMutation.isPending ? 'animate-spin' : ''}`} />
                                    {generationMutation.isPending ? 'Gerando...' : 'Gerar Faturas Próximo Mês'}
                                </button>
                                <button onClick={handleExportCSV} className="flex-grow sm:flex-grow-0 flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                                    <FaFileCsv className="mr-2" /> Exportar
                                </button>
                            </>
                         )}
                        <button onClick={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })} className="p-2 rounded-md hover:bg-slate-700 text-slate-300" aria-label="Recarregar faturas">
                            <FaRedo className={`transition-transform duration-500 ${isRefetching ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 p-4 mb-6 bg-slate-900/50 rounded-lg border border-slate-700 flex-wrap">
                    <div className="relative w-full md:w-auto md:flex-grow">
                        <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Buscar por aluno..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"/>
                    </div>
                    <div className="w-full md:w-auto">
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="block w-full rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2">
                            <option value="ALL">Todos os Status</option>
                            <option value={InvoiceStatus.ABERTA}>Aberta</option> <option value={InvoiceStatus.PAGA}>Paga</option>
                            <option value={InvoiceStatus.ATRASADA}>Atrasada</option> <option value={InvoiceStatus.PARCIALMENTE_PAGA}>Parcialmente Paga</option>
                            <option value={InvoiceStatus.CANCELADA}>Cancelada</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block w-full rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2" aria-label="Data de início"/>
                        <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="block w-full rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2" aria-label="Data de fim"/>
                    </div>
                    <button onClick={handleClearFilters} className="w-full md:w-auto flex items-center justify-center bg-slate-600 text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-500 transition text-sm font-medium">
                        <FaTimes className="mr-2" /> Limpar
                    </button>
                </div>
                
                {isLoading ? <SkeletonTable headers={['Aluno', 'Vencimento', 'Valor', 'Status', 'Ações']} /> : (
                <div className="overflow-x-auto">
                    {paginatedInvoices.length > 0 ? (
                    <>
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('member.nome')}>Aluno {getSortIcon('member.nome')}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('vencimento')}>Vencimento {getSortIcon('vencimento')}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('valor')}>Valor {getSortIcon('valor')}</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-slate-700">
                                {paginatedInvoices.map((invoice) => (
                                    <InvoiceRow
                                        key={invoice.id}
                                        invoice={invoice}
                                        onPayClick={handleOpenPaymentModal}
                                        onGenerateLinkClick={handleGenerateLink}
                                        isLinkGenerating={linkGenerationMutation.isPending && selectedInvoice?.id === invoice.id}
                                    />
                                ))}
                            </tbody>
                        </table>
                        <Pagination 
                            currentPage={currentPage}
                            totalCount={sortedItems.length}
                            pageSize={ITEMS_PER_PAGE}
                            onPageChange={page => setCurrentPage(page)}
                        />
                    </>
                    ) : (
                        <EmptyState 
                            title="Nenhuma fatura encontrada"
                            message="Parece que não há faturas correspondentes aos filtros selecionados."
                        />
                    )}
                </div>
                )}
            </div>
             <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSave={handleSavePayment}
                invoice={selectedInvoice}
                isSaving={paymentMutation.isPending}
            />
             <PaymentLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => {
                    setIsLinkModalOpen(false);
                    setGeneratedLink(null);
                    setSelectedInvoice(null);
                }}
                invoice={selectedInvoice}
                link={generatedLink}
            />
        </>
    );
};

export default Invoices;