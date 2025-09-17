import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMemberById, getEnrollmentByMemberId, getInvoicesByMemberId, updateMember } from '../../services/api/members';
import { Member, Enrollment, Invoice, InvoiceStatus } from '../../types';
import { formatDate, formatCurrency, getStatusBadge, getActiveStatusBadge, formatDateOnly } from '../../lib/utils';
import { FaArrowLeft, FaUser, FaIdCard, FaCalendarAlt, FaPhone, FaDumbbell, FaFileInvoiceDollar, FaSave, FaSpinner } from 'react-icons/fa';
import { useToast } from '../../contexts/ToastContext';

const MemberProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [notes, setNotes] = useState('');

    const { data, isLoading, error } = useQuery({
      queryKey: ['memberProfile', id],
      queryFn: async () => {
        if (!id) throw new Error("Member ID is required");
        const [memberData, enrollmentData, invoicesData] = await Promise.all([
            getMemberById(id),
            getEnrollmentByMemberId(id),
            getInvoicesByMemberId(id),
        ]);
        if (!memberData) throw new Error("Member not found");
        setNotes(memberData.observacoes || '');
        return { member: memberData, enrollment: enrollmentData, invoices: invoicesData };
      },
      enabled: !!id,
    });

    const updateNotesMutation = useMutation({
        mutationFn: (updatedMember: Member) => updateMember(updatedMember),
        onSuccess: () => {
            addToast('Observações salvas com sucesso!', 'success');
            queryClient.invalidateQueries({ queryKey: ['memberProfile', id] });
        },
        onError: (error: Error) => {
            addToast(`Falha ao salvar: ${error.message}`, 'error');
        }
    });

    const handleSaveNotes = () => {
        if (!data?.member) return;
        updateNotesMutation.mutate({ ...data.member, observacoes: notes });
    };

    const { member, enrollment, invoices } = data || {};
    
    const invoiceRows = useMemo(() => {
        if (!invoices) {
            return (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400">Carregando faturas...</td>
                </tr>
            );
        }
        if (invoices.length === 0) {
            return (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400">Nenhuma fatura encontrada.</td>
                </tr>
            );
        }
        return invoices.map(invoice => {
            const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.valor, 0) || 0;
            return (
                <tr key={invoice.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">{invoice.competencia}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">{formatDate(new Date(invoice.vencimento))}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-200">
                        <div>{formatCurrency(invoice.valor)}</div>
                        {invoice.status === InvoiceStatus.PARCIALMENTE_PAGA && (<div className="text-xs text-yellow-500 font-normal">Pago: {formatCurrency(totalPaid)}</div>)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">{getStatusBadge(invoice.status)}</td>
                </tr>
            );
        });
    }, [invoices]);


    if (isLoading) {
        return <div className="text-center p-10">Carregando perfil do aluno...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">{(error as Error).message || 'Aluno não encontrado.'}</div>;
    }

    if (!member) return null;

    return (
        <>
            <div className="mb-6">
                <Link to="/members" className="flex items-center text-sm font-medium text-primary-500 hover:text-primary-400">
                    <FaArrowLeft className="mr-2" /> Voltar para a lista de alunos
                </Link>
            </div>

            <div className="bg-card p-6 rounded-lg border border-slate-700 shadow-sm mb-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-primary-900 rounded-full flex items-center justify-center">
                        <FaUser className="w-12 h-12 text-primary-400" />
                    </div>
                </div>
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-slate-100">{member.nome}</h1>
                    <p className="text-md text-slate-400">{member.email}</p>
                    <div className="mt-2">{getActiveStatusBadge(member.ativo)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-card p-6 rounded-lg border border-slate-700 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center"><FaIdCard className="mr-3 text-primary-500" /> Informações Pessoais</h2>
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li className="flex items-center"><FaPhone className="mr-3 text-slate-400" /> <strong>Telefone:</strong> <span className="ml-2">{member.telefone}</span></li>
                            <li className="flex items-center"><FaIdCard className="mr-3 text-slate-400" /> <strong>CPF:</strong> <span className="ml-2">{member.cpf}</span></li>
                            <li className="flex items-center"><FaCalendarAlt className="mr-3 text-slate-400" /> <strong>Nascimento:</strong> <span className="ml-2">{formatDateOnly(new Date(member.dataNascimento))}</span></li>
                        </ul>
                    </div>
                    
                    {enrollment && (
                        <div className="bg-card p-6 rounded-lg border border-slate-700 shadow-sm">
                            <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center"><FaDumbbell className="mr-3 text-primary-500" /> Matrícula</h2>
                             <ul className="space-y-3 text-sm text-slate-300">
                                <li><strong>Plano:</strong> <span className="font-semibold text-slate-100">{enrollment.plan.nome}</span></li>
                                <li><strong>Status:</strong> <span className="font-semibold text-slate-100">{enrollment.status}</span></li>
                                <li><strong>Início:</strong> {formatDate(new Date(enrollment.inicio))}</li>
                                <li><strong>Próximo Venc.:</strong> {formatDate(new Date(enrollment.fim))}</li>
                            </ul>
                        </div>
                    )}

                     <div className="bg-card p-6 rounded-lg border border-slate-700 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-100 mb-4">Observações</h2>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="w-full p-2 border border-slate-600 bg-slate-700 text-slate-200 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Adicione anotações sobre o aluno..."/>
                        <button onClick={handleSaveNotes} disabled={updateNotesMutation.isPending} className="mt-3 w-full flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:bg-primary-700/50">
                           {updateNotesMutation.isPending ? <FaSpinner className="animate-spin mr-2"/> : <FaSave className="mr-2" />}
                           {updateNotesMutation.isPending ? 'Salvando...' : 'Salvar Observações'}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-slate-700 shadow-sm">
                     <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center"><FaFileInvoiceDollar className="mr-3 text-primary-500" /> Histórico de Faturas</h2>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Competência</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Vencimento</th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Valor</th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-slate-700">
                                {invoiceRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MemberProfile;
