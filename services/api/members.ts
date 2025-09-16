import { Member, Enrollment, Invoice, EnrollmentStatus, Plan, LogActionType, Role } from '../../types';
import { allMembers, enrollments, invoices, plans, saveDatabase, simulateDelay, removeMemberData } from './database';
import { addLog } from './logs';
import { faker } from '@faker-js/faker/locale/pt_BR';

export const getMembers = async (query?: string, statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ACTIVE'): Promise<Member[]> => {
    let filteredMembers = allMembers;

    if (statusFilter !== 'ALL') {
        filteredMembers = filteredMembers.filter(m => m.ativo === (statusFilter === 'ACTIVE'));
    }
    if (query) {
        const lowercasedQuery = query.toLowerCase();
        filteredMembers = filteredMembers.filter(m => 
            m.nome.toLowerCase().includes(lowercasedQuery) || 
            m.cpf.includes(lowercasedQuery)
        );
    }
    
    const sorted = [...filteredMembers].sort((a, b) => a.nome.localeCompare(b.nome));
    return simulateDelay(sorted);
};

export const addMember = async (newMemberData: Omit<Member, 'id' | 'ativo'>, planId: string | null): Promise<Member> => {
    const existingMember = allMembers.find(m => m.email.toLowerCase() === newMemberData.email.toLowerCase());
    if (existingMember) {
        throw new Error(`Um aluno com o email "${newMemberData.email}" já está cadastrado.`);
    }

    const newMember: Member = {
        id: faker.string.uuid(),
        ...newMemberData,
        ativo: true,
    };
    allMembers.push(newMember);

    if (planId) {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            const newEnrollment: Enrollment = {
                id: faker.string.uuid(),
                member: newMember,
                plan: plan,
                inicio: new Date(),
                fim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Placeholder
                status: EnrollmentStatus.ATIVA,
                diaVencimento: new Date().getDate(),
            };
            enrollments.push(newEnrollment);
        }
    }
    
    saveDatabase();
    await addLog(LogActionType.CREATE, `Novo aluno criado: ${newMember.nome}.`);
    return simulateDelay(newMember);
};

export const updateMember = async (updatedMemberData: Member, planId?: string | null): Promise<Member> => {
    const index = allMembers.findIndex(m => m.id === updatedMemberData.id);
    if (index === -1) throw new Error('Aluno não encontrado.');
    
    allMembers[index] = updatedMemberData;
    
    const enrollmentIndex = enrollments.findIndex(e => e.member.id === updatedMemberData.id);

    if (planId) {
        const plan = plans.find(p => p.id === planId);
        if (!plan) throw new Error('Plano não encontrado');

        if (enrollmentIndex > -1) {
            enrollments[enrollmentIndex].plan = plan;
            enrollments[enrollmentIndex].status = EnrollmentStatus.ATIVA;
        } else {
             const newEnrollment: Enrollment = {
                id: faker.string.uuid(), member: updatedMemberData, plan,
                inicio: new Date(), fim: new Date(), status: EnrollmentStatus.ATIVA,
                diaVencimento: new Date().getDate(),
            };
            enrollments.push(newEnrollment);
        }
    } else if (enrollmentIndex > -1) {
        enrollments.splice(enrollmentIndex, 1);
    }
    
    saveDatabase();
    await addLog(LogActionType.UPDATE, `Dados do aluno ${updatedMemberData.nome} atualizados.`);
    return simulateDelay(updatedMemberData);
};

export const toggleMemberStatus = async (memberId: string): Promise<Member> => {
    const memberIndex = allMembers.findIndex(m => m.id === memberId);
    if (memberIndex === -1) throw new Error("Aluno não encontrado");

    const member = allMembers[memberIndex];
    member.ativo = !member.ativo;
    allMembers[memberIndex] = member;

    const enrollmentIndex = enrollments.findIndex(e => e.member.id === memberId);
    if (enrollmentIndex > -1) {
        enrollments[enrollmentIndex].status = member.ativo ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA;
    }
    
    saveDatabase();
    await addLog(LogActionType.UPDATE, `Status do aluno ${member.nome} alterado para ${member.ativo ? 'ATIVO' : 'INATIVO'}.`);
    return simulateDelay(member);
};

export const deleteMember = async (memberId: string): Promise<{ success: boolean }> => {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) throw new Error("Aluno não encontrado.");
    
    removeMemberData(memberId); // This function from database.ts handles cascading deletes
    saveDatabase();

    await addLog(LogActionType.DELETE, `Aluno "${member.nome}" e todos os seus dados foram excluídos.`);
    return simulateDelay({ success: true });
};

export const getMemberById = async (id: string): Promise<Member | undefined> => {
    return simulateDelay(allMembers.find(m => m.id === id));
};

export const getEnrollmentByMemberId = async (memberId: string): Promise<Enrollment | undefined> => {
    return simulateDelay(enrollments.find(e => e.member.id === memberId));
};

export const getInvoicesByMemberId = async (memberId: string): Promise<Invoice[]> => {
    const memberInvoices = invoices.filter(i => i.member.id === memberId)
        .sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
    return simulateDelay(memberInvoices);
};

export const globalSearch = async (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    if (!query) return { members: [], invoices: [] };
    const lowerQuery = query.toLowerCase();

    const foundMembers = allMembers
        .filter(m => m.nome.toLowerCase().includes(lowerQuery))
        .slice(0, 5);
        
    const foundInvoices = invoices
        .filter(i => i.member.nome.toLowerCase().includes(lowerQuery))
        .slice(0, 5);

    return simulateDelay({ members: foundMembers, invoices: foundInvoices });
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
    const studentInvoices = await getInvoicesByMemberId(studentId);
    const plan = enrollment ? enrollment.plan : null;

    return { member, enrollment, invoices: studentInvoices, plan };
};

export const updateStudentProfile = async (studentId: string, data: { email?: string; telefone?: string }): Promise<Member> => {
    const memberIndex = allMembers.findIndex(m => m.id === studentId);
    if (memberIndex === -1) throw new Error("Falha ao atualizar perfil.");

    if (data.email) allMembers[memberIndex].email = data.email;
    if (data.telefone) allMembers[memberIndex].telefone = data.telefone;
    
    saveDatabase();
    
    const updatedMember = allMembers[memberIndex];
    await addLog(LogActionType.UPDATE, `Aluno ${updatedMember.nome} atualizou o perfil no portal.`);
    return simulateDelay(updatedMember);
};