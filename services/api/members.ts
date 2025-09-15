import { Member, Enrollment, Invoice, EnrollmentStatus, Plan } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { LogActionType } from '../../types';
import { addLog } from './logs';

export const getMembers = async (query?: string, statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ACTIVE'): Promise<Member[]> => {
    let queryBuilder = supabase
        .from('members')
        .select('*')
        .order('nome', { ascending: true });

    if (query) {
        queryBuilder = queryBuilder.or(`nome.ilike.%${query}%,cpf.ilike.%${query}%`);
    }
    
    if (statusFilter !== 'ALL') {
        const isActive = statusFilter === 'ACTIVE';
        queryBuilder = queryBuilder.eq('ativo', isActive);
    }

    const { data, error } = await queryBuilder;

    if (error) {
        console.error('Error fetching members:', error);
        throw error;
    }
    return data;
};

export const addMember = async (newMemberData: Omit<Member, 'id' | 'ativo'>, planId: string | null): Promise<Member> => {
    const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert({
            ...newMemberData,
            ativo: true,
            observacoes: '',
        })
        .select()
        .single();
    
    if (memberError) throw memberError;

    if (planId) {
        const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
        if (plan) {
            const enrollment = {
                member_id: memberData.id,
                plan_id: plan.id,
                inicio: new Date().toISOString(),
                fim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), // default to 1 year
                status: EnrollmentStatus.ATIVA,
                diaVencimento: new Date().getDate(),
            };
            const { error: enrollmentError } = await supabase.from('enrollments').insert(enrollment);
            if (enrollmentError) throw enrollmentError;
        }
    }
    
    await addLog(LogActionType.CREATE, `Novo aluno criado: ${memberData.nome}.`);
    return memberData;
};

export const updateMember = async (updatedMember: Member, planId?: string | null): Promise<Member> => {
    const { data, error } = await supabase
        .from('members')
        .update(updatedMember)
        .eq('id', updatedMember.id)
        .select()
        .single();

    if (error) throw error;

    if (planId !== undefined) {
        const { data: existingEnrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('member_id', updatedMember.id)
            .single();

        if (planId === null) { // Removing plan
            if (existingEnrollment) {
                await supabase.from('enrollments').delete().eq('id', existingEnrollment.id);
            }
        } else { // Adding or updating plan
            const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
            if (plan) {
                if (existingEnrollment) {
                    await supabase.from('enrollments').update({ plan_id: plan.id }).eq('id', existingEnrollment.id);
                } else {
                    await supabase.from('enrollments').insert({
                        member_id: updatedMember.id,
                        plan_id: plan.id,
                        inicio: new Date().toISOString(),
                        fim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                        status: EnrollmentStatus.ATIVA,
                        diaVencimento: new Date().getDate(),
                    });
                }
            }
        }
    }
    
    await addLog(LogActionType.UPDATE, `Dados do aluno ${updatedMember.nome} atualizados.`);
    return data;
};

export const toggleMemberStatus = async (memberId: string): Promise<Member> => {
    const { data: currentMember } = await supabase.from('members').select('ativo, nome').eq('id', memberId).single();
    if (!currentMember) throw new Error('Member not found');
    
    const newStatus = !currentMember.ativo;
    
    const { data: updatedMember, error } = await supabase
        .from('members')
        .update({ ativo: newStatus })
        .eq('id', memberId)
        .select()
        .single();

    if (error) throw error;
    
    await supabase
        .from('enrollments')
        .update({ status: newStatus ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA })
        .eq('member_id', memberId);

    await addLog(LogActionType.UPDATE, `Status do aluno ${updatedMember.nome} alterado para ${newStatus ? 'ATIVO' : 'INATIVO'}.`);
    return updatedMember;
};

export const deleteMember = async (memberId: string): Promise<{ success: boolean }> => {
    const { data: member, error: findError } = await supabase.from('members').select('nome').eq('id', memberId).single();
    if (findError || !member) throw new Error('Aluno não encontrado');

    const { error } = await supabase.from('members').delete().eq('id', memberId);
    if (error) throw error;
    
    await addLog(LogActionType.DELETE, `Aluno "${member.nome}" e todos os seus dados associados foram permanentemente excluídos.`);
    return { success: true };
};

export const getMemberById = async (id: string): Promise<Member | undefined> => {
    const { data, error } = await supabase.from('members').select('*').eq('id', id).single();
    if (error) throw error;
    return data ?? undefined;
};

export const getEnrollmentByMemberId = async (memberId: string): Promise<Enrollment | undefined> => {
    const { data, error } = await supabase
        .from('enrollments')
        .select('*, plan:plans(*)')
        .eq('member_id', memberId)
        .single();
    if (error) {
        if (error.code === 'PGRST116') return undefined; // Not found, which is ok
        throw error;
    }
    return data ? { ...data, member: {} as Member } : undefined; // member will be populated by getMemberById
};

export const getInvoicesByMemberId = async (memberId: string): Promise<Invoice[]> => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*, payments(*)')
        .eq('member_id', memberId)
        .order('vencimento', { ascending: false });
    if (error) throw error;
    return data.map(i => ({...i, member: {} as Member })) as Invoice[];
};

export const globalSearch = async (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    if (!query) {
        return { members: [], invoices: [] };
    }
    const lowercasedQuery = `%${query.toLowerCase()}%`;

    const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*')
        .or(`nome.ilike.${lowercasedQuery},cpf.ilike.${lowercasedQuery}`)
        .limit(5);

    if (membersError) throw membersError;

    const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, member:members(*)')
        .ilike('members.nome', lowercasedQuery)
        .limit(5);

    if (invoicesError) throw invoicesError;

    return { members: members || [], invoices: (invoices || []) as Invoice[] };
};

// --- Student Portal Specific API Functions ---

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

    return { member, enrollment: enrollment as Enrollment, invoices, plan };
};

export const updateStudentProfile = async (studentId: string, data: { email?: string; telefone?: string }): Promise<Member> => {
    const { data: updatedMember, error } = await supabase
        .from('members')
        .update(data)
        .eq('id', studentId)
        .select()
        .single();
    
    if (error) throw error;
    
    await addLog(LogActionType.UPDATE, `Aluno ${updatedMember.nome} atualizou seu próprio perfil no portal.`);
    return updatedMember;
};