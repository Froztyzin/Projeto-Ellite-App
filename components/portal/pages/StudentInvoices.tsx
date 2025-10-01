import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudentProfileData } from '../../../services/api/members';
import { generatePixPayment, confirmPixPayment } from '../../../services/api/invoices';
import { Invoice, InvoiceStatus, Payment } from '../../../types';
import { formatCurrency, formatDateOnly, getStatusBadge } from '../../../lib/utils';
import { 
    FaFileInvoiceDollar, FaSpinner, FaQrcode, FaCopy, FaCheckCircle, 
    FaTimes, FaExclamationTriangle, FaHistory 
} from 'react-icons/fa';
import SkeletonTable from '../../shared/skeletons/SkeletonTable';
import EmptyState from '../../shared/EmptyState';
import { useToast } from '../../../contexts/ToastContext';

const PaymentHistory: React.FC<{ payments: Payment[] }> = React.memo(({ payments }) => (
    <div className="mt-2 pl-6 border-l-2 border-slate-600">
        <h4 className="text-xs font-semibold text-slate-400 mb-1">Pagamentos Realizados:</h4>
        <ul className="text-xs space-y-1">
            {payments.map(p => (
                <li key={p.id} className="flex justify-between items-center text-slate-400">
                    <span>{formatDateOnly(new Date(p.data))} - {p.metodo}</span>
                    <span className="font-semibold text-green-400">{formatCurrency(p.valor)}</span>
                </li>
            ))}
        </ul>
    </div>
));
PaymentHistory.displayName = 'PaymentHistory';

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
            queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
            setTimeout(() => onClose(), 2000);
        },
        onError: () => addToast('Falha na confirmação do pagamento.', 'error'),
    });
    
    const { 
        mutate: generateMutate, data: pixData, isPending: isGenerating, 
        isSuccess: isGenerateSuccess, isError: isGenerateError, reset: generateReset 
    } = generatePixMutation;
    
    const { 
        mutate: confirmMutate, isPending: isConfirming, 
        isSuccess: isConfirmSuccess, reset: confirmReset 
    } = confirmPixMutation;

    useEffect(() => {
        if (isOpen && invoice && !pixData && !isGenerating) {
            generateMutate(invoice.id);
        }
        if (!isOpen) {
            generateReset();
            confirmReset();
            setCopied(false);
        }
    }, [isOpen, invoice, pixData, isGenerating, generateMutate, generateReset, confirmReset]);


    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast('Código PIX copiado!', 'success');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen || !invoice) return null;

    const renderContent = () => {
        if (isGenerating || (!pixData && !isGenerateError)) {
            return (
                <div className="text-center p-8">
                    <FaSpinner className="animate-spin text-4xl mx-auto text-primary-500" />
                    <p className="mt-4 text-slate-300">Gerando cobrança PIX...</p>
                </div>
            );
        }

        if (isConfirming) {
             return (
                <div className="text-center p-8">
                    <FaSpinner className="animate-spin text-4xl mx-auto text-primary-500" />
                    <p className="mt-4 text-slate-300">Confirmando pagamento...</p>
                </div>
            );
        }
        
        if (isConfirmSuccess) {
            return (
                 <div className="text-center p-8">
                    <FaCheckCircle className="text-5xl mx-auto text-green-500" />
                    <p className="mt-4 text-xl font-semibold text-slate-100">Pagamento Confirmado!</p>
                    <p className="text-slate-300">Sua fatura foi atualizada.</p>
                </div>
            )
        }

        if (isGenerateSuccess && pixData) {
            const { qrCode, pixKey } = pixData;
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
                        onClick={() => confirmMutate(invoice.id)} 
                        disabled={isConfirming}
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
                     <button onClick={onClose} disabled={isConfirming || isConfirmSuccess} className="text-slate-400 bg-transparent hover:bg-slate-600 hover:text-slate-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>
                {renderContent()}
            </div>
        </div>
    )
}

const InvoiceItem: React.FC<{invoice: Invoice, onPayClick: (invoice: Invoice) => void}> = ({ invoice, onPayClick }) => {
    const isPending = [InvoiceStatus.ABERTA, InvoiceStatus.ATRASADA, InvoiceStatus.PARCIALMENTE_PAGA].includes(invoice.status);
    
    return (
        <div className={`bg-card p-4 rounded-lg border border-slate-700 shadow-sm transition-all hover:border-slate-500 ${!isPending && 'opacity-70'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <p className="text-sm text-slate-400">Competência: <span className="font-semibold text-slate-200">{invoice.competencia}</span></p>
                    <p className="text-sm text-slate-400">Vencimento: <span className="font-semibold text-slate-200">{formatDateOnly(new Date(invoice.vencimento))}</span></p>
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

            {isPending && (
                <div className="mt-3 pt-3 border-t border-slate-700 flex justify-end">
                    <button onClick={() => onPayClick(invoice)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold text-sm flex items-center gap-2">
                       <FaQrcode /> Pagar com PIX
                    </button>
                </div>
            )}
        </div>
    );
};

interface StudentInvoicesProps {
    studentId: string;
}

const StudentInvoices: React.FC<StudentInvoicesProps> = ({ studentId }) => {
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['studentProfile', studentId],
        queryFn: () => {
            if (!studentId) throw new Error("ID do aluno não fornecido");
            return getStudentProfileData(studentId);
        },
        enabled: !!studentId,
    });
    
    const summary = useMemo(() => {
        if (!data?.invoices) return { overdue: 0, open: 0, overdueCount: 0, openCount: 0 };

        const overdueInvoices = data.invoices.filter(inv => inv.status === InvoiceStatus.ATRASADA);
        const openInvoices = data.invoices.filter(inv => inv.status === InvoiceStatus.ABERTA || inv.status === InvoiceStatus.PARCIALMENTE_PAGA);

        const calculateRemaining = (inv: Invoice) => inv.valor - (inv.payments?.reduce((s, p) => s + p.valor, 0) || 0);

        return {
            overdue: overdueInvoices.reduce((sum, inv) => sum + calculateRemaining(inv), 0),
            open: openInvoices.reduce((sum, inv) => sum + calculateRemaining(inv), 0),
            overdueCount: overdueInvoices.length,
            openCount: openInvoices.length,
        };
    }, [data?.invoices]);

    const { pendingInvoices, historyInvoices } = useMemo(() => {
        if (!data?.invoices) return { pendingInvoices: [], historyInvoices: [] };

        const pending = data.invoices
            .filter(inv => [InvoiceStatus.ABERTA, InvoiceStatus.ATRASADA, InvoiceStatus.PARCIALMENTE_PAGA].includes(inv.status))
            .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());

        const history = data.invoices
            .filter(inv => [InvoiceStatus.PAGA, InvoiceStatus.CANCELADA].includes(inv.status))
            .sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());

        return { pendingInvoices: pending, historyInvoices: history };
    }, [data?.invoices]);

    
    const handlePayClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPixModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm animate-pulse">
                <div className="h-8 bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="h-24 bg-slate-700 rounded mb-6"></div>
                <SkeletonTable headers={['Detalhes', 'Valor', 'Status']} rows={3} />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-400 text-center p-8 bg-card rounded-lg">Erro ao carregar suas faturas.</div>;
    }
    
    return (
        <>
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-100">Minhas Faturas</h1>
            
            <div className="bg-card p-6 rounded-lg border border-slate-700">
                <h2 className="text-lg font-semibold text-slate-200 mb-4">Resumo Financeiro</h2>
                {summary.overdueCount === 0 && summary.openCount === 0 ? (
                    <div className="flex items-center gap-4 text-green-400">
                        <FaCheckCircle className="text-4xl" />
                        <div>
                            <p className="font-bold text-xl">Tudo em dia!</p>
                            <p className="text-sm">Você não possui faturas pendentes.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {summary.overdueCount > 0 && (
                            <div className="bg-red-900/50 p-4 rounded-lg">
                                <p className="text-sm text-red-300">Total Vencido ({summary.overdueCount} {summary.overdueCount > 1 ? 'faturas' : 'fatura'})</p>
                                <p className="text-2xl font-bold text-red-400">{formatCurrency(summary.overdue)}</p>
                            </div>
                        )}
                        {summary.openCount > 0 && (
                            <div className="bg-blue-900/50 p-4 rounded-lg">
                                <p className="text-sm text-blue-300">A Vencer ({summary.openCount} {summary.openCount > 1 ? 'faturas' : 'fatura'})</p>
                                <p className="text-2xl font-bold text-blue-400">{formatCurrency(summary.open)}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {pendingInvoices.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-3">
                        <FaExclamationTriangle className="text-yellow-400" /> Faturas Pendentes
                    </h2>
                    <div className="space-y-4">
                        {pendingInvoices.map(invoice => (
                            <InvoiceItem key={invoice.id} invoice={invoice} onPayClick={handlePayClick} />
                        ))}
                    </div>
                </div>
            )}
            
            {historyInvoices.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-3">
                        <FaHistory className="text-slate-400" /> Histórico de Faturas
                    </h2>
                    <div className="space-y-4">
                        {historyInvoices.map(invoice => (
                            <InvoiceItem key={invoice.id} invoice={invoice} onPayClick={handlePayClick} />
                        ))}
                    </div>
                </div>
            )}

            {pendingInvoices.length === 0 && historyInvoices.length === 0 && (
                 <div className="bg-card p-8 rounded-lg border border-slate-700">
                    <EmptyState
                        title="Nenhuma fatura encontrada"
                        message="Seu histórico de faturas aparecerá aqui."
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