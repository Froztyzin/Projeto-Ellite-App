import { Member, Enrollment, Invoice, EnrollmentStatus, User, Plan } from '../../types';
import { allMembers, enrollments, invoices, plans } from './database';
import { simulateDelay } from './database';
import { faker } from '@faker-js/faker/locale/pt_BR';

export const getMembers = (query?: string, statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ACTIVE') => {
    let filteredMembers = allMembers;

    if (query) {
        const lowercasedQuery = query.toLowerCase();
        filteredMembers = filteredMembers.filter(member => 
            member.nome.toLowerCase().includes(lowercasedQuery) ||
            member.cpf.includes(lowercasedQuery)
        );
    }
    
    if (statusFilter !== 'ALL') {
        const isActive = statusFilter === 'ACTIVE';
        filteredMembers = filteredMembers.filter(member => member.ativo === isActive);
    }

    return simulateDelay(filteredMembers);
};

export const addMember = (newMemberData: Omit<Member, 'id' | 'ativo'>, planId: string | null): Promise<Member> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newMember: Member = {
                id: faker.string.uuid(),
                ...newMemberData,
                ativo: true,
                observacoes: '',
            };
            allMembers.unshift(newMember);

            if (planId) {
                const plan = plans.find(p => p.id === planId);
                if (plan) {
                    const enrollment: Enrollment = {
                        id: faker.string.uuid(),
                        member: newMember,
                        plan,
                        inicio: new Date(),
                        fim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // default to 1 year
                        status: EnrollmentStatus.ATIVA,
                        diaVencimento: new Date().getDate(),
                    };
                    enrollments.push(enrollment);
                }
            }

            resolve(JSON.parse(JSON.stringify(newMember)));
        }, 500);
    });
};

export const updateMember = (updatedMember: Member, planId?: string | null): Promise<Member> => {
     return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = allMembers.findIndex(m => m.id === updatedMember.id);
            if (index !== -1) {
                allMembers[index] = { ...allMembers[index], ...updatedMember };
                
                if (planId !== undefined) {
                    const enrollmentIndex = enrollments.findIndex(e => e.member.id === updatedMember.id);
                    if (planId === null) { // Removing plan
                        if (enrollmentIndex !== -1) enrollments.splice(enrollmentIndex, 1);
                    } else { // Adding or updating plan
                        const plan = plans.find(p => p.id === planId);
                        if (plan) {
                            if (enrollmentIndex !== -1) {
                                enrollments[enrollmentIndex].plan = plan;
                            } else {
                                 const enrollment: Enrollment = {
                                    id: faker.string.uuid(), member: allMembers[index], plan,
                                    inicio: new Date(), fim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                                    status: EnrollmentStatus.ATIVA, diaVencimento: new Date().getDate(),
                                };
                                enrollments.push(enrollment);
                            }
                        }
                    }
                }
                
                resolve(JSON.parse(JSON.stringify(allMembers[index])));
            } else {
                reject(new Error('Member not found'));
            }
        }, 500);
    });
};

export const toggleMemberStatus = (memberId: string): Promise<Member> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = allMembers.findIndex(m => m.id === memberId);
            if (index !== -1) {
                const updatedMember = { ...allMembers[index], ativo: !allMembers[index].ativo };
                allMembers[index] = updatedMember;

                const enrollmentIndex = enrollments.findIndex(e => e.member.id === memberId);
                if (enrollmentIndex !== -1) {
                    enrollments[enrollmentIndex].status = updatedMember.ativo ? EnrollmentStatus.ATIVA : EnrollmentStatus.CANCELADA;
                    enrollments[enrollmentIndex].member = updatedMember;
                }

                resolve(JSON.parse(JSON.stringify(updatedMember)));
            } else {
                reject(new Error('Member not found'));
            }
        }, 300);
    });
};

export const getMemberById = (id: string): Promise<Member | undefined> => simulateDelay(allMembers.find(m => m.id === id));
export const getEnrollmentByMemberId = (memberId: string): Promise<Enrollment | undefined> => simulateDelay(enrollments.find(e => e.member.id === memberId));
export const getInvoicesByMemberId = (memberId: string): Promise<Invoice[]> => simulateDelay(invoices.filter(i => i.member.id === memberId).sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime()));

export const globalSearch = (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            if (!query) {
                resolve({ members: [], invoices: [] });
                return;
            }
            const lowercasedQuery = query.toLowerCase();

            const foundMembers = allMembers.filter(member =>
                member.nome.toLowerCase().includes(lowercasedQuery) ||
                member.cpf.includes(lowercasedQuery)
            ).slice(0, 5);

            const foundInvoices = invoices.filter(invoice =>
                invoice.member.nome.toLowerCase().includes(lowercasedQuery)
            ).slice(0, 5);

            resolve({ members: foundMembers, invoices: foundInvoices });
        }, 300);
    });
};


// --- Student Portal Specific API Functions ---

interface StudentProfileData {
    member: Member;
    enrollment: Enrollment | null;
    invoices: Invoice[];
    plan: Plan | null;
}

// In a real app, this would get the user ID from the auth token
export const getStudentProfileData = async (studentId: string): Promise<StudentProfileData> => {
    const member = await getMemberById(studentId);
    if (!member) throw new Error("Student not found");

    const enrollment = await getEnrollmentByMemberId(studentId) || null;
    const invoices = await getInvoicesByMemberId(studentId);
    const plan = enrollment ? enrollment.plan : null;

    return simulateDelay({ member, enrollment, invoices, plan });
};

export const updateStudentProfile = (studentId: string, data: { email?: string; telefone?: string }): Promise<Member> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = allMembers.findIndex(m => m.id === studentId);
            if (index !== -1) {
                const currentMember = allMembers[index];
                const updatedMember = { 
                    ...currentMember, 
                    email: data.email ?? currentMember.email,
                    telefone: data.telefone ?? currentMember.telefone
                };
                allMembers[index] = updatedMember;
                resolve(JSON.parse(JSON.stringify(updatedMember)));
            } else {
                reject(new Error('Student not found'));
            }
        }, 500);
    });
};