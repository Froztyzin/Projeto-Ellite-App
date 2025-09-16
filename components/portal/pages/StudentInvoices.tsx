import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { getStudentProfileData } from '../../../services/api/members';
import { generatePixPayment, confirmPixPayment } from '../../../services/api/invoices';
import { Invoice, InvoiceStatus, Payment } from '../../../types';
import { formatCurrency, formatDate, getStatusBadge } from '../../../lib/utils';
import { 
    FaFileInvoiceDollar, FaSort, FaSortUp, FaSortDown, FaSpinner, 
    FaQrcode, FaCopy, FaCheckCircle, FaTimes 
} from 'react-icons/fa';
import SkeletonTable from '../../shared/skeletons/SkeletonTable';
import EmptyState from '../../shared/EmptyState';
import { useToast } from '../../../contexts/ToastContext';

const PaymentHistory: React.FC<{ payments: Payment[] }> = ({ payments }) => (
    <div className="mt-2 pl-6 border-l-2 border-slate-600">
        <h4 className="text-xs font-semibold text-slate-400 mb-1">Pagamentos Realizados:</h4>
        <ul className="text-xs space-y-1">
            {payments.map(p => (
                <li key={p.id} className="flex justify-between items-center text-slate-400">
                    <span>{formatDate(new Date(p.data))} - {p.metodo}</span>
                    <span className="font-semibold text-green-400">{formatCurrency(p.valor)}</span>
                </li>
            ))}
        </ul>
    </div>
);

const PixPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
}> = ({ isOpen, onClose, invoice }) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [copied, setCopied] = useState(false);

    const generatePixMutation = useMutation({
        mutationFn: (invoiceId: string) => generatePixPayment(invoiceId),
        onError: () => addToast('Falha ao gerar PIX. Tente novamente.', 'error'),
    });

    const confirmPixMutation = useMutation({
        mutationFn: (invoiceId: string) => confirmPixPayment(invoiceId),
        onSuccess: () => {
            addToast('Pagamento confirmado com sucesso!', 'success');
            // Invalidate all relevant queries to ensure synchronization across portals
            queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
            queryClient.invalidateQueries({ queryKey: ['reportsData'] });
            queryClient.invalidateQueries({ queryKey: ['notificationHistory'] });
            setTimeout(() => {
                onClose();
            }, 2000);
        },
        onError: () => addToast('Falha na confirmação do pagamento.', 'error'),
    });
    
    React.useEffect(() => {
        if (isOpen && invoice && !generatePixMutation.data && !generatePixMutation.isPending) {
            generatePixMutation.mutate(invoice.id);
        }
        if (!isOpen) {
            generatePixMutation.reset();
            confirmPixMutation.reset();
            setCopied(false);
        }
    }, [isOpen, invoice, generatePixMutation]);


    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast('Código PIX copiado!', 'success');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen || !invoice) return null;

    const renderContent = () => {
        if (generatePixMutation.isPending || (!generatePixMutation.data && !generatePixMutation.isError)) {
            return (
                <div className="text-center p-8">
                    <FaSpinner className="animate-spin text-4xl mx-auto text-primary-500" />
                    <p className="mt-4 text-slate-300">Gerando cobrança PIX...</p>
                </div>
            );
        }

        if (confirmPixMutation.isPending) {
             return (
                <div className="text-center p-8">
                    <FaSpinner className="animate-spin text-4xl mx-auto text-primary-500" />
                    <p className="mt-4 text-slate-300">Confirmando pagamento...</p>
                </div>
            );
        }
        
        if (confirmPixMutation.isSuccess) {
            return (
                 <div className="text-center p-8">
                    <FaCheckCircle className="text-5xl mx-auto text-green-500" />
                    <p className="mt-4 text-xl font-semibold text-slate-100">Pagamento Confirmado!</p>
                    <p className="text-slate-300">Sua fatura foi atualizada.</p>
                </div>
            )
        }

        if (generatePixMutation.isSuccess && generatePixMutation.data) {
            const { qrCode, pixKey } = generatePixMutation.data;
            return (
                <div className="p-4 sm:p-6 text-center">
                    <h4 className="text-lg font-semibold text-slate-100 mb-2">Pague com PIX</h4>
                    <p className="text-sm text-slate-400 mb-4">Aponte a câmera do seu celular para o QR Code ou use o "Copia e Cola".</p>
                    <img src={qrCode} alt="QR Code PIX" className="mx-auto w-48 h-48 rounded-lg bg-white p-2" />
                    
                    <div className="mt-4">
                        <label className="text-xs text-slate-400">PIX Copia e Cola</label>
                        <div className="flex items-center gap-2 mt-1">
                            <input type="text" readOnly value={pixKey} className="w-full truncate text-xs p-2 rounded-lg border border-slate-600 bg-slate-900 text-slate-300" />
                            <button onClick={() => handleCopy(pixKey)} className={`flex-shrink-0 p-2 rounded-lg transition-colors text-white ${copied ? 'bg-green-600' : 'bg-slate-600 hover:bg-slate-500'}`} title={copied ? 'Copiado!' : 'Copiar código'}>
                                {copied ? <FaCheckCircle /> : <FaCopy />}
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={() => confirmPixMutation.mutate(invoice.id)} 
                        disabled={confirmPixMutation.isPending}
                        className="w-full mt-6 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2 disabled:bg-green-800"
                    >
                        <FaCheckCircle />
                        Já paguei, confirmar!
                    </button>
                </div>
            );
        }
        
        return (
             <div className="text-center p-8">
                <FaTimes className="text-4xl mx-auto text-red-500" />
                <p className="mt-4 text-slate-300">Ocorreu um erro ao gerar o PIX.</p>
                <button onClick={onClose} className="mt-4 bg-slate-600 text-white px-4 py-2 rounded-lg">Fechar</button>
            </div>
        )
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-sm">
                <div className="flex justify-end p-2">
                     <button onClick={onClose} disabled={confirmPixMutation.isPending || confirmPixMutation.isSuccess} className="text-slate-400 bg-transparent hover:bg-slate-600 hover:text-slate-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>
                {renderContent()}
            </div>
        </div>
    )
}


const StudentInvoices: React.FC = () => {
    const { user } = useAuth();
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'vencimento', direction: 'descending' });
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['studentProfile', user?.id],
        queryFn: () => {
            if (!user?.id) throw new Error("Usuário não encontrado");
            return getStudentProfileData(user.id);
        },
        enabled: !!user?.id,
    });
    
    const processedInvoices = useMemo(() => {
        if (!data?.invoices) return [];
        let invoices = [...data.invoices];
        
        if (statusFilter !== 'ALL') {
            invoices = invoices.filter(invoice => invoice.status === statusFilter);
        }

        invoices.sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === 'vencimento') {
                valA = new Date(a.vencimento).getTime();
                valB = new Date(b.vencimento).getTime();
            } else { // 'valor'
                valA = a.valor;
                valB = b.valor;
            }
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return invoices;
    }, [data?.invoices, statusFilter, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <FaSort className="inline ml-1 opacity-40" />;
        return sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />;
    };
    
    const handlePayClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPixModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Minhas Faturas</h1>
                <SkeletonTable headers={['Detalhes', 'Valor', 'Status']} rows={5} />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-400 text-center p-8 bg-card rounded-lg">Erro ao carregar suas faturas.</div>;
    }
    
    return (
        <>
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-100">Minhas Faturas</h1>
            
            <div className="bg-card p-4 rounded-lg border border-slate-700">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:w-auto sm:flex-grow">
                        <label htmlFor="status-filter" className="sr-only">Filtrar por Status</label>
                        <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full block rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2">
                            <option value="ALL">Todos os Status</option>
                            <option value={InvoiceStatus.ABERTA}>Aberta</option>
                            <option value={InvoiceStatus.PAGA}>Paga</option>
                            <option value={InvoiceStatus.ATRASADA}>Atrasada</option>
                            <option value={InvoiceStatus.CANCELADA}>Cancelada</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-auto flex items-center gap-2">
                        <span className="text-sm text-slate-400">Ordenar por:</span>
                        <button onClick={() => requestSort('vencimento')} className={`px-3 py-1 rounded-md text-sm ${sortConfig.key === 'vencimento' ? 'bg-primary-600 text-white' : 'bg-slate-600 hover:bg-slate-500'}`}>
                            Vencimento {getSortIcon('vencimento')}
                        </button>
                        <button onClick={() => requestSort('valor')} className={`px-3 py-1 rounded-md text-sm ${sortConfig.key === 'valor' ? 'bg-primary-600 text-white' : 'bg-slate-600 hover:bg-slate-500'}`}>
                            Valor {getSortIcon('valor')}
                        </button>
                    </div>
                </div>
            </div>

            {processedInvoices.length > 0 ? (
                <div className="space-y-4">
                    {processedInvoices.map(invoice => (
                        <div key={invoice.id} className="bg-card p-4 rounded-lg border border-slate-700 shadow-sm transition-all hover:border-slate-500">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="text-sm text-slate-400">Competência: <span className="font-semibold text-slate-200">{invoice.competencia}</span></p>
                                    <p className="text-sm text-slate-400">Vencimento: <span className="font-semibold text-slate-200">{formatDate(new Date(invoice.vencimento))}</span></p>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                                    <p className="text-lg font-bold text-slate-100">{formatCurrency(invoice.valor)}</p>
                                    <div className="flex-shrink-0">{getStatusBadge(invoice.status)}</div>
                                </div>
                            </div>
                            
                            {invoice.payments && invoice.payments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-700">
                                    <PaymentHistory payments={invoice.payments} />
                                </div>
                            )}

                            {[InvoiceStatus.ABERTA, InvoiceStatus.ATRASADA].includes(invoice.status) && (
                                <div className="mt-3 pt-3 border-t border-slate-700 flex justify-end">
                                    <button onClick={() => handlePayClick(invoice)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold text-sm">
                                        Pagar com PIX
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card p-8 rounded-lg border border-slate-700">
                    <EmptyState
                        title="Nenhuma fatura encontrada"
                        message="Não há faturas para os filtros selecionados. Que tal mudar o filtro para 'Paga' para ver seu histórico?"
                        icon={<FaFileInvoiceDollar />}
                    />
                </div>
            )}
        </div>
        <PixPaymentModal 
            isOpen={isPixModalOpen}
            onClose={() => setIsPixModalOpen(false)}
            invoice={selectedInvoice}
        />
        </>
    );
};

export default StudentInvoices;
