import { Member, Enrollment, Invoice, EnrollmentStatus, Plan, LogActionType } from '../../types';
import { supabase } from '../supabaseClient';
import { addLog } from './logs';

export const getMembers = async (query?: string, statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ACTIVE'): Promise<Member[]> => {
    let queryBuilder = supabase.from('members').select('*');

    if (statusFilter !== 'ALL') {
        queryBuilder = queryBuilder.eq('ativo', statusFilter === 'ACTIVE');
    }
    if (query) {
        // This query searches for the name OR the CPF.
        queryBuilder = queryBuilder.or(`nome.ilike.%${query}%,cpf.ilike.%${query}%`);
    }

    const { data, error } = await queryBuilder.order('nome', { ascending: true });

    if (error) {
        console.error("Error fetching members:", error);
        throw new Error('Não foi possível buscar os alunos.');
    }
    return data;
};

export const addMember = async (newMemberData: Omit<Member, 'id' | 'ativo'>, planId: string | null): Promise<Member> => {
    const { data: newMember, error } = await supabase
        .from('members')
        .insert({ ...newMemberData, ativo: true })
        .select()
        .single();
    
    if (error) throw new Error(`Falha ao criar aluno: ${error.message}`);

    if (planId) {
        const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
        if (plan) {
            const { error: enrollmentError } = await supabase.from('enrollments').insert({
                member_id: newMember.id,
                plan_id: plan.id,
                inicio: new Date().toISOString(),
                // Placeholder 'fim' date, should be calculated based on plan periodicity
                fim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                status: EnrollmentStatus.ATIVA,
                diaVencimento: new Date().getDate(),
            });
            if (enrollmentError) console.error("Falha ao criar matrícula para novo aluno:", enrollmentError);
        }
    }
    
    await addLog(LogActionType.CREATE, `Novo aluno criado: ${newMember.nome}.`);
    return newMember;
};

export const updateMember = async (updatedMember: Member, planId?: string | null): Promise<Member> => {
    const { data, error } = await supabase
        .from('members')
        .update(updatedMember)
        .eq('id', updatedMember.id)
        .select()
        .single();
        
    if (error) throw new Error(`Falha ao atualizar aluno: ${error.message}`);
    
    if (planId !== undefined) {
        // This logic can be complex. For simplicity, we'll upsert the enrollment.
        // A more robust solution might use a database function (RPC).
        const { data: existingEnrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('member_id', updatedMember.id)
            .maybeSingle();

        if (planId === null && existingEnrollment) { // Remove plan
            await supabase.from('enrollments').delete().eq('id', existingEnrollment.id);
        } else if (planId) { // Add or update plan
            await supabase.from('enrollments').upsert({
                id: existingEnrollment?.id,
                member_id: updatedMember.id,
                plan_id: planId,
                status: EnrollmentStatus.ATIVA,
                // These might need to be adjusted based on business logic for plan changes
                inicio: existingEnrollment ? undefined : new Date().toISOString(),
                diaVencimento: existingEnrollment ? undefined : new Date().getDate()
            });
        }
    }
    
    await addLog(LogActionType.UPDATE, `Dados do aluno ${data.nome} atualizados.`);
    return data;
};

export const toggleMemberStatus = async (memberId: string): Promise<Member> => {
    // Fix: Correctly await getMemberById and handle its direct return value (Member | undefined).
    // The previous destructuring was incorrect for the function's return type.
    const member = await getMemberById(memberId);
    if (!member) throw new Error("Aluno não encontrado");

    const newStatus = !member.ativo;

    const { data, error } = await supabase
        .from('members')
        .update({ ativo: newStatus })
        .eq('id', memberId)
        .select()
        .single();

    if (error) throw new Error("Falha ao alterar status do aluno.");

    // Also update enrollment status
    await supabase
        .from('enrollments')
        .update({ status: newStatus ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA })
        .eq('member_id', memberId);

    await addLog(LogActionType.UPDATE, `Status do aluno ${data.nome} alterado para ${newStatus ? 'ATIVO' : 'INATIVO'}.`);
    return data;
};

export const deleteMember = async (memberId: string): Promise<{ success: boolean }> => {
    // IMPORTANT: This requires setting up cascading deletes in your Supabase database schema
    // to ensure all related data (enrollments, invoices, etc.) is also removed.
    // Fix: Correctly await getMemberById and handle its direct return value (Member | undefined).
    // The previous destructuring was incorrect for the function's return type.
    const member = await getMemberById(memberId);
    const { error } = await supabase.from('members').delete().eq('id', memberId);
    if (error) throw new Error("Falha ao excluir aluno. Verifique se há dados associados.");

    await addLog(LogActionType.DELETE, `Aluno "${member?.nome}" e todos os seus dados foram excluídos.`);
    return { success: true };
};

export const getMemberById = async (id: string): Promise<Member | undefined> => {
    const { data, error } = await supabase.from('members').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
};

export const getEnrollmentByMemberId = async (memberId: string): Promise<Enrollment | undefined> => {
    const { data, error } = await supabase
        .from('enrollments')
        .select('*, plans(*)')
        .eq('member_id', memberId)
        .maybeSingle();
    
    if (error) return undefined;
    // Map Supabase response to application type
    return data ? { ...data, plan: data.plans as any } as unknown as Enrollment : undefined;
};

export const getInvoicesByMemberId = async (memberId: string): Promise<Invoice[]> => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*, payments(*)')
        .eq('member_id', memberId)
        .order('vencimento', { ascending: false });

    if (error) return [];
    return data as any[];
};

export const globalSearch = async (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    if (!query) return { members: [], invoices: [] };

    const [membersRes, invoicesRes] = await Promise.all([
        supabase.from('members').select('*').ilike('nome', `%${query}%`).limit(5),
        supabase.from('invoices').select('*, members(nome)').ilike('members.nome', `%${query}%`).limit(5)
    ]);
    
    const invoicesData = invoicesRes.data?.map(inv => ({ ...inv, member: inv.members as any })) || [];

    return { members: membersRes.data || [], invoices: invoicesData };
};

interface StudentProfileData {
    member: Member;
    enrollment: Enrollment | null;
    invoices: Invoice[];
    plan: Plan | null;
}

export const getStudentProfileData = async (studentId: string): Promise<StudentProfileData> => {
    const member = await getMemberById(studentId);
    if (!member) throw new Error("Aluno não encontrado");

    const enrollment = await getEnrollmentByMemberId(studentId) || null;
    const invoices = await getInvoicesByMemberId(studentId);
    const plan = enrollment ? enrollment.plan : null;

    return { member, enrollment, invoices, plan };
};

export const updateStudentProfile = async (studentId: string, data: { email?: string; telefone?: string }): Promise<Member> => {
    const { data: updatedMember, error } = await supabase
        .from('members')
        .update({ email: data.email, telefone: data.telefone })
        .eq('id', studentId)
        .select()
        .single();

    if (error) throw new Error("Falha ao atualizar perfil.");

    await addLog(LogActionType.UPDATE, `Aluno ${updatedMember.nome} atualizou o perfil no portal.`);
    return updatedMember;
};