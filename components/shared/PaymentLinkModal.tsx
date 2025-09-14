import React, { useState } from 'react';
import { Invoice } from '../../types';
import { FaTimes, FaCopy, FaCheck, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

interface PaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  link: string | null;
}

const PaymentLinkModal: React.FC<PaymentLinkModalProps> = ({ isOpen, onClose, invoice, link }) => {
    const { addToast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setCopied(true);
        addToast('Link copiado para a área de transferência!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen || !invoice || !link) return null;

    const message = `Olá ${invoice.member.nome.split(' ')[0]}, aqui está o link para pagamento da sua fatura de ${formatCurrency(invoice.valor)}: ${link}`;
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    const emailLink = `mailto:${invoice.member.email}?subject=Link de Pagamento - Fatura ${invoice.competencia}&body=${encodeURIComponent(message)}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-100">Compartilhar Link de Pagamento</h3>
                    <button onClick={onClose} className="text-slate-400 p-1.5 rounded-full hover:bg-slate-600">
                        <FaTimes />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="text-sm">
                        <p className="text-slate-400">Fatura para: <span className="font-semibold text-slate-200">{invoice.member.nome}</span></p>
                        <p className="text-slate-400">Valor: <span className="font-semibold text-slate-200">{formatCurrency(invoice.valor)}</span></p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Link para Pagamento</label>
                        <div className="flex items-center gap-2">
                            <input type="text" readOnly value={link} className="w-full truncate text-sm p-2 rounded-lg border border-slate-600 bg-slate-900 text-slate-300" />
                            <button onClick={handleCopy} className={`flex-shrink-0 p-3 rounded-lg transition-colors text-white ${copied ? 'bg-green-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
                                {copied ? <FaCheck /> : <FaCopy />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                         <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg hover:bg-[#128C7E] transition font-semibold">
                            <FaWhatsapp /> WhatsApp
                        </a>
                        <a href={emailLink} className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-500 transition font-semibold">
                            <FaEnvelope /> Email
                        </a>
                    </div>
                </div>
                <div className="p-4 bg-slate-900/50 flex justify-end rounded-b-lg">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentLinkModal;
