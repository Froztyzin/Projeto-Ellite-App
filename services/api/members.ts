import { Member, Enrollment, Invoice, EnrollmentStatus, Plan, LogActionType } from '../../types';
import { supabase } from '../supabaseClient';
import { fromMember, fromEnrollment, fromInvoice, toMember } from './mappers';
import { addLog } from './logs';

export const getMembers = async (query?: string, statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ACTIVE'): Promise<Member[]> => {
    let request = supabase.from('members').select('*');

    if (query) {
        request = request.or(`nome.ilike.%${query}%,cpf.ilike.%${query}%`);
    }
    if (statusFilter !== 'ALL') {
        request = request.eq('ativo', statusFilter === 'ACTIVE');
    }

    const { data, error } = await request.order('nome', { ascending: true });
    if (error) throw new Error(error.message);
    return data.map(fromMember);
};

export const addMember = async (newMemberData: Omit<Member, 'id' | 'ativo' | 'observacoes'>, planId: string | null): Promise<Member> => {
    // In a real application, you would handle user creation in Supabase Auth here
    // For simplicity, we assume an auth user is created separately or not required for this step.
    
    const memberModel = toMember({ ...newMemberData, ativo: true });
    const { data, error } = await supabase
        .from('members')
        .insert(memberModel)
        .select()
        .single();
    
    if (error) throw new Error(error.message);
    const newMember = fromMember(data);

    if (planId) {
        const { data: planData, error: planError } = await supabase.from('plans').select('*').eq('id', planId).single();
        if (planError) throw new Error(planError.message);

        const enrollment = {
            member_id: newMember.id,
            plan_id: planId,
            inicio: new Date().toISOString(),
            fim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            status: EnrollmentStatus.ATIVA,
            dia_vencimento: new Date().getDate(),
        };
        const { error: enrollmentError } = await supabase.from('enrollments').insert(enrollment);
        if (enrollmentError) throw new Error(enrollmentError.message);
    }
    
    await addLog(LogActionType.CREATE, `Novo aluno criado: ${newMember.nome}.`);
    return newMember;
};

export const updateMember = async (updatedMember: Member, planId?: string | null): Promise<Member> => {
    const memberModel = toMember(updatedMember);
    const { data, error } = await supabase
        .from('members')
        .update(memberModel)
        .eq('id', updatedMember.id)
        .select()
        .single();

    if (error) throw new Error(error.message);

    if (planId !== undefined) {
        const { data: existingEnrollment } = await supabase.from('enrollments').select('id').eq('member_id', updatedMember.id).single();

        if (planId === null) { // Remove plan
            if (existingEnrollment) {
                await supabase.from('enrollments').delete().eq('id', existingEnrollment.id);
            }
        } else { // Add or update plan
            const enrollmentData = {
                member_id: updatedMember.id,
                plan_id: planId,
                status: EnrollmentStatus.ATIVA,
            };
            if (existingEnrollment) {
                await supabase.from('enrollments').update(enrollmentData).eq('id', existingEnrollment.id);
            } else {
                await supabase.from('enrollments').insert({
                    ...enrollmentData,
                    inicio: new Date().toISOString(),
                    fim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                    dia_vencimento: new Date().getDate(),
                });
            }
        }
    }

    await addLog(LogActionType.UPDATE, `Dados do aluno ${updatedMember.nome} atualizados.`);
    return fromMember(data);
};

export const toggleMemberStatus = async (memberId: string): Promise<Member> => {
    const { data: currentMember } = await supabase.from('members').select('ativo, nome').eq('id', memberId).single();
    if (!currentMember) throw new Error('Member not found');

    const newStatus = !currentMember.ativo;
    const { data: updatedMemberData, error } = await supabase
        .from('members')
        .update({ ativo: newStatus })
        .eq('id', memberId)
        .select()
        .single();
    if (error) throw new Error(error.message);

    await supabase
        .from('enrollments')
        .update({ status: newStatus ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA })
        .eq('member_id', memberId);

    await addLog(LogActionType.UPDATE, `Status do aluno ${currentMember.nome} alterado para ${newStatus ? 'ATIVO' : 'INATIVO'}.`);
    return fromMember(updatedMemberData);
};

export const deleteMember = async (memberId: string): Promise<{ success: boolean }> => {
    const { data: member, error: memberError } = await supabase.from('members').select('nome').eq('id', memberId).single();
    if (memberError || !member) throw new Error('Aluno não encontrado');
    
    // In a real DB with cascading deletes, you might only need to delete the member.
    // Here, we explicitly delete related data for clarity.
    await supabase.from('payments').delete().in('invoice_id', supabase.from('invoices').select('id').eq('member_id', memberId));
    await supabase.from('invoices').delete().eq('member_id', memberId);
    await supabase.from('enrollments').delete().eq('member_id', memberId);
    await supabase.from('notifications').delete().eq('member_id', memberId);
    
    const { error: deleteError } = await supabase.from('members').delete().eq('id', memberId);
    if (deleteError) throw new Error(deleteError.message);

    await addLog(LogActionType.DELETE, `Aluno "${member.nome}" e todos os seus dados associados foram permanentemente excluídos.`);
    return { success: true };
};

export const getMemberById = async (id: string): Promise<Member | undefined> => {
    const { data, error } = await supabase.from('members').select('*').eq('id', id).single();
    if (error) return undefined;
    return fromMember(data);
};

export const getEnrollmentByMemberId = async (memberId: string): Promise<Enrollment | undefined> => {
    const { data, error } = await supabase
        .from('enrollments')
        .select('*, members(*), plans(*)')
        .eq('member_id', memberId)
        .single();
    if (error) return undefined;
    return fromEnrollment(data);
};

export const getInvoicesByMemberId = async (memberId: string): Promise<Invoice[]> => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*, members(*), payments(*)')
        .eq('member_id', memberId)
        .order('vencimento', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map(fromInvoice);
};

export const globalSearch = async (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    if (!query) return { members: [], invoices: [] };
    const lowercasedQuery = `%${query.toLowerCase()}%`;

    const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*')
        .ilike('nome', lowercasedQuery)
        .limit(5);

    const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, members(*)')
        .ilike('members.nome', lowercasedQuery)
        .limit(5);

    if (membersError || invoicesError) {
        console.error(membersError || invoicesError);
        return { members: [], invoices: [] };
    }

    return { members: members.map(fromMember), invoices: invoices.map(fromInvoice) };
};

interface StudentProfileData {
    member: Member;
    enrollment: Enrollment | null;
    invoices: Invoice[];
    plan: Plan | null;
}

export const getStudentProfileData = async (studentId: string): Promise<StudentProfileData> => {
    const member = await getMemberById(studentId);
    if (!member) throw new Error("Student not found");

    const enrollment = await getEnrollmentByMemberId(studentId) || null;
    const invoices = await getInvoicesByMemberId(studentId);
    const plan = enrollment ? enrollment.plan : null;

    return { member, enrollment, invoices, plan };
};

export const updateStudentProfile = async (studentId: string, data: { email?: string; telefone?: string }): Promise<Member> => {
    const { data: updatedData, error } = await supabase
        .from('members')
        .update({ email: data.email, telefone: data.telefone })
        .eq('id', studentId)
        .select()
        .single();
    
    if (error) throw new Error(error.message);
    await addLog(LogActionType.UPDATE, `Aluno ${updatedData.nome} atualizou seu próprio perfil no portal.`);
    return fromMember(updatedData);
};
