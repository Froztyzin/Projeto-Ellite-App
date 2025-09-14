import React, { useState, useEffect } from 'react';
import { Invoice, PaymentMethod } from '../../types';
import { FaTimes } from 'react-icons/fa';
import { formatCurrency } from '../../lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentData: { valor: number, data: Date, metodo: PaymentMethod, notas?: string }) => void;
  invoice: Invoice | null;
  isSaving: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSave, invoice, isSaving }) => {
    const getInitialState = () => ({
        valor: '',
        data: new Date().toISOString().split('T')[0],
        metodo: PaymentMethod.PIX,
        notas: '',
    });

    const [formData, setFormData] = useState(getInitialState());
    const [totalPaid, setTotalPaid] = useState(0);

    useEffect(() => {
        if (invoice && isOpen) {
            const paidAmount = invoice.payments?.reduce((sum, p) => sum + p.valor, 0) || 0;
            const remainingAmount = invoice.valor - paidAmount;
            setTotalPaid(paidAmount);
            setFormData({
                ...getInitialState(),
                valor: remainingAmount > 0 ? remainingAmount.toFixed(2) : '',
            });
        } else {
            setFormData(getInitialState());
            setTotalPaid(0);
        }
    }, [invoice, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice) return;

        const paymentValue = parseFloat(formData.valor);
        if (isNaN(paymentValue) || paymentValue <= 0) {
            alert("Por favor, insira um valor de pagamento válido.");
            return;
        }
        if (paymentValue > invoice.valor - totalPaid) {
            alert(`O valor do pagamento não pode ser maior que o saldo devedor (${formatCurrency(invoice.valor - totalPaid)}).`);
            return;
        }

        const date = new Date(formData.data);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const correctedDate = new Date(date.getTime() + userTimezoneOffset);

        onSave({
            valor: paymentValue,
            data: correctedDate,
            metodo: formData.metodo,
            notas: formData.notas,
        });
    };

    if (!isOpen || !invoice) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-100">
                        Registrar Pagamento
                    </h3>
                    <button onClick={onClose} className="text-slate-400 bg-transparent hover:bg-slate-600 hover:text-slate-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <FaTimes className="w-5 h-5" />
                        <span className="sr-only">Fechar modal</span>
                    </button>
                </div>
                <div className="p-4 sm:p-5 border-b border-slate-700 bg-slate-900/50 text-sm space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-400">Aluno:</span>
                        <span className="font-semibold text-slate-200 text-right truncate">{invoice.member.nome}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-400">Valor Total da Fatura:</span>
                        <span className="font-semibold text-slate-200">{formatCurrency(invoice.valor)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-400">Saldo Devedor:</span>
                        <span className="font-semibold text-red-500">{formatCurrency(invoice.valor - totalPaid)}</span>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-4 sm:p-5">
                    <div className="grid gap-4 mb-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="valor" className="block mb-2 text-sm font-medium text-slate-300">Valor a Pagar (R$)</label>
                            <input type="number" name="valor" id="valor" step="0.01" value={formData.valor} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" placeholder="99.90" required />
                        </div>
                        <div>
                           <label htmlFor="data" className="block mb-2 text-sm font-medium text-slate-300">Data do Pagamento</label>
                            <input type="date" name="data" id="data" value={formData.data} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" required />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="metodo" className="block mb-2 text-sm font-medium text-slate-300">Método de Pagamento</label>
                            <select name="metodo" id="metodo" value={formData.metodo} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" required>
                                {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="notas" className="block mb-2 text-sm font-medium text-slate-300">Notas (Opcional)</label>
                            <textarea name="notas" id="notas" rows={3} value={formData.notas} onChange={handleChange} className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5" placeholder="Ex: Pagamento adiantado..."></textarea>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button type="submit" disabled={isSaving} className="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-primary-700/50">
                            {isSaving ? 'Salvando...' : 'Salvar Pagamento'}
                        </button>
                        <button type="button" onClick={onClose} className="text-slate-300 bg-transparent hover:bg-slate-700 focus:ring-4 focus:outline-none focus:ring-slate-600 rounded-lg border border-slate-600 text-sm font-medium px-5 py-2.5 hover:text-white focus:z-10">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;