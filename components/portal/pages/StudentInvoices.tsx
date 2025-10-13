import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudentProfileData } from '../../services/mockApi';
import { generatePixPayment, confirmPixPayment } from '../../services/mockApi';
import { Invoice, InvoiceStatus, Payment } from '../../../types';
import { formatCurrency, formatDateOnly, getStatusBadge } from '../../../lib/utils';
import { 
    FaFileInvoiceDollar, FaSpinner, FaQrcode, FaCopy, FaCheckCircle, 
    FaTimes, FaExclamationTriangle, FaHistory 
} from 'react-icons/fa';
import SkeletonTable from '../../shared/skeletons/SkeletonTable';
import EmptyState from '../../shared/EmptyState';
import { useToast } from '../../contexts/ToastContext';

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

    const generatePixMutation = useMutation<{ qrCode: string; pixKey: string; }, Error, string>({
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
InvoiceItem.displayName = 'InvoiceItem';

interface StudentInvoicesProps {
    studentId: string;
}

const StudentInvoices: React.FC<StudentInvoicesProps> = ({ studentId }) => {
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['studentProfile', studentId],
        queryFn: () => getStudentProfileData(studentId),
        enabled: !!studentId,
    });

    const handlePayClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPixModalOpen(true);
    };

    const sortedInvoices = useMemo(() => {
        if (!data?.invoices) return [];
        return [...data.invoices].sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
    }, [data?.invoices]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-100">Minhas Faturas</h1>

            <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
                {isLoading ? <SkeletonTable headers={['Detalhes', 'Valor', 'Status']} rows={3} /> :
                 error ? <p className="text-red-400 text-center">Erro ao carregar faturas.</p> :
                 sortedInvoices.length > 0 ? (
                    <div className="space-y-4">
                        {sortedInvoices.map(invoice => (
                            <InvoiceItem key={invoice.id} invoice={invoice} onPayClick={handlePayClick} />
                        ))}
                    </div>
                ) : (
                    <EmptyState 
                        title="Nenhuma fatura encontrada"
                        message="Você não possui faturas em seu histórico."
                        icon={<FaFileInvoiceDollar />}
                    />
                )}
            </div>

            <PixPaymentModal
                isOpen={isPixModalOpen}
                onClose={() => setIsPixModalOpen(false)}
                invoice={selectedInvoice}
            />
        </div>
    );
};

export default StudentInvoices;
