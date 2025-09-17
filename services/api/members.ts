import { Member, Enrollment, Invoice, Plan, LogActionType, EnrollmentStatus } from '../../types';
import { getDB, saveDatabase, addLog, simulateDelay } from './database';
import { faker } from '@faker-js/faker';

export const getMembers = async (query?: string, statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ACTIVE'): Promise<Member[]> => {
    const db = getDB();
    let members = db.members;

    if (statusFilter !== 'ALL') {
        members = members.filter(m => m.ativo === (statusFilter === 'ACTIVE'));
    }

    if (query) {
        const lowerQuery = query.toLowerCase();
        members = members.filter(m => 
            m.nome.toLowerCase().includes(lowerQuery) || 
            m.cpf.replace(/\D/g, '').includes(lowerQuery)
        );
    }
    
    return simulateDelay(members.sort((a, b) => a.nome.localeCompare(b.nome)));
};

export const addMember = async (newMemberData: Omit<Member, 'id' | 'ativo'>, planId: string | null): Promise<Member> => {
    const db = getDB();
    const newMember: Member = {
        ...newMemberData,
        id: faker.string.uuid(),
        ativo: true,
    };
    db.members.unshift(newMember);

    if (planId) {
        const plan = db.plans.find(p => p.id === planId);
        if (plan) {
             const now = new Date();
             let endDate = new Date(now);
             if (plan.periodicidade === 'MENSAL') endDate.setMonth(endDate.getMonth() + 1);
             else if (plan.periodicidade === 'TRIMESTRAL') endDate.setMonth(endDate.getMonth() + 3);
             else if (plan.periodicidade === 'ANUAL') endDate.setFullYear(endDate.getFullYear() + 1);
            
            const newEnrollment: Enrollment = {
                id: faker.string.uuid(),
                member: newMember,
                plan: plan,
                inicio: now,
                fim: endDate,
                // Fix: Changed string literal 'ATIVA' to use the EnrollmentStatus enum value.
                status: EnrollmentStatus.ATIVA,
                diaVencimento: now.getDate()
            };
            db.enrollments.push(newEnrollment);
        }
    }

    addLog(LogActionType.CREATE, `Novo aluno criado: ${newMember.nome}`);
    saveDatabase();
    return simulateDelay(newMember);
};

export const updateMember = async (updatedMemberData: Member, planId?: string | null): Promise<Member> => {
    const db = getDB();
    const memberIndex = db.members.findIndex(m => m.id === updatedMemberData.id);
    if (memberIndex === -1) {
        throw new Error("Aluno não encontrado.");
    }
    db.members[memberIndex] = updatedMemberData;
    addLog(LogActionType.UPDATE, `Dados do aluno ${updatedMemberData.nome} atualizados.`);
    saveDatabase();
    return simulateDelay(updatedMemberData);
};


export const toggleMemberStatus = async (memberId: string): Promise<Member> => {
    const db = getDB();
    const member = db.members.find(m => m.id === memberId);
    if (!member) throw new Error("Aluno não encontrado.");
    member.ativo = !member.ativo;
    
    const enrollment = db.enrollments.find(e => e.member.id === memberId);
    if (enrollment) {
        // Fix: Changed string literals to use the EnrollmentStatus enum values.
        enrollment.status = member.ativo ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA;
    }

    addLog(LogActionType.UPDATE, `Status do aluno ${member.nome} alterado para ${member.ativo ? 'ATIVO' : 'INATIVO'}.`);
    saveDatabase();
    return simulateDelay(member);
};

export const deleteMember = async (memberId: string): Promise<{ success: boolean }> => {
    const db = getDB();
    const memberName = db.members.find(m => m.id === memberId)?.nome || 'Desconhecido';
    
    // Hard delete for a more realistic demo effect
    db.payments = db.payments.filter(p => db.invoices.find(i => i.id === p.invoiceId)?.member.id !== memberId);
    db.notifications = db.notifications.filter(n => n.member.id !== memberId);
    db.invoices = db.invoices.filter(i => i.member.id !== memberId);
    db.enrollments = db.enrollments.filter(e => e.member.id !== memberId);
    db.members = db.members.filter(m => m.id !== memberId);
    
    addLog(LogActionType.DELETE, `Aluno ${memberName} e todos os seus dados foram excluídos.`);
    saveDatabase();
    
    return simulateDelay({ success: true });
};

export const getMemberById = async (id: string): Promise<Member | undefined> => {
    const db = getDB();
    return simulateDelay(db.members.find(m => m.id === id));
};

export const getEnrollmentByMemberId = async (memberId: string): Promise<Enrollment | undefined> => {
    const db = getDB();
    return simulateDelay(db.enrollments.find(e => e.member.id === memberId));
};

export const getInvoicesByMemberId = async (memberId: string): Promise<Invoice[]> => {
    const db = getDB();
    const memberInvoices = db.invoices
      .filter(i => i.member.id === memberId)
      .map(invoice => ({
          ...invoice,
          payments: db.payments.filter(p => p.invoiceId === invoice.id)
      }))
      .sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
    return simulateDelay(memberInvoices);
};

export const globalSearch = async (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    if (!query) return { members: [], invoices: [] };
    const db = getDB();
    const lowerQuery = query.toLowerCase();

    const members = db.members.filter(m => 
        m.nome.toLowerCase().includes(lowerQuery) ||
        m.email.toLowerCase().includes(lowerQuery)
    ).slice(0, 5); // Limit results

    const invoices: Invoice[] = []; // In a real scenario, you might search invoices too

    return simulateDelay({ members, invoices });
};

interface StudentProfileData {
    member: Member;
    enrollment: Enrollment | null;
    invoices: Invoice[];
    plan: Plan | null;
}

export const getStudentProfileData = async (studentId: string): Promise<StudentProfileData> => {
    const db = getDB();
    const member = db.members.find(m => m.id === studentId);
    if (!member) throw new Error("Aluno não encontrado");

    const enrollment = db.enrollments.find(e => e.member.id === studentId && e.status === 'ATIVA') || null;
    const invoices = await getInvoicesByMemberId(studentId);
    
    return simulateDelay({
        member,
        enrollment,
        invoices,
        plan: enrollment?.plan || null,
    });
};

export const updateStudentProfile = async (studentId: string, data: { email?: string; telefone?: string }): Promise<Member> => {
    const db = getDB();
    const member = db.members.find(m => m.id === studentId);
    if (!member) throw new Error("Aluno não encontrado.");
    
    if (data.email) member.email = data.email;
    if (data.telefone) member.telefone = data.telefone;
    
    addLog(LogActionType.UPDATE, `Aluno ${member.nome} atualizou seu perfil.`);
    saveDatabase();
    return simulateDelay(member);
};