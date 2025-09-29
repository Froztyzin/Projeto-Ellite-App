import { Member, Enrollment, Invoice, Plan } from '../../types';
import * as mockApi from '../mockApi';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export const getMembers = async (query?: string, statusFilter: StatusFilter = 'ACTIVE'): Promise<Member[]> => {
    return mockApi.getMembers(query, statusFilter);
};

export const addMember = async (newMemberData: Omit<Member, 'id' | 'ativo'>, planId: string | null): Promise<Member> => {
    return mockApi.addMember(newMemberData, planId);
};

export const updateMember = async (updatedMemberData: Member, planId?: string | null): Promise<Member> => {
    return mockApi.updateMember(updatedMemberData, planId);
};

export const toggleMemberStatus = async (memberId: string): Promise<Member> => {
    return mockApi.toggleMemberStatus(memberId);
};

export const deleteMember = async (memberId: string): Promise<{ success: boolean }> => {
    return mockApi.deleteMember(memberId);
};

export const getMemberById = async (id: string): Promise<Member | undefined> => {
    return mockApi.getMemberById(id);
};

export const getEnrollmentByMemberId = async (memberId: string): Promise<Enrollment | undefined> => {
    return mockApi.getEnrollmentByMemberId(memberId);
};

export const getInvoicesByMemberId = async (memberId: string): Promise<Invoice[]> => {
    return mockApi.getInvoicesByMemberId(memberId);
};

export const globalSearch = async (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    return mockApi.globalSearch(query);
};

interface StudentProfileData {
    member: Member;
    enrollment: Enrollment | null;
    invoices: Invoice[];
    plan: Plan | null;
}

export const getStudentProfileData = async (studentId: string): Promise<StudentProfileData> => {
    return mockApi.getStudentProfileData(studentId);
};

export const updateStudentProfile = async (studentId: string, profileData: { email?: string; telefone?: string }): Promise<Member> => {
    return mockApi.updateStudentProfile(studentId, profileData);
};
