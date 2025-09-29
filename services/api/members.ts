import { Member, Enrollment, Invoice, Plan, EnrollmentStatus } from '../../types';
import apiClient from '../apiClient';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export const getMembers = async (query?: string, statusFilter: StatusFilter = 'ACTIVE'): Promise<Member[]> => {
    const { data } = await apiClient.get<Member[]>('/api/members', {
        params: { query, status: statusFilter }
    });
    return data;
};

export const addMember = async (newMemberData: Omit<Member, 'id' | 'ativo'>, planId: string | null): Promise<Member> => {
    const { data } = await apiClient.post<Member>('/api/members', { memberData: newMemberData, planId });
    return data;
};

export const updateMember = async (updatedMemberData: Member, planId?: string | null): Promise<Member> => {
    const { data } = await apiClient.put<Member>(`/api/members/${updatedMemberData.id}`, { memberData: updatedMemberData, planId });
    return data;
};

export const toggleMemberStatus = async (memberId: string): Promise<Member> => {
    const { data } = await apiClient.patch<Member>(`/api/members/${memberId}/status`);
    return data;
};

export const deleteMember = async (memberId: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/api/members/${memberId}`);
    return data;
};

export const getMemberById = async (id: string): Promise<Member | undefined> => {
    const { data } = await apiClient.get<Member>(`/api/members/${id}`);
    return data;
};

export const getEnrollmentByMemberId = async (memberId: string): Promise<Enrollment | undefined> => {
    const { data } = await apiClient.get<Enrollment>(`/api/members/${memberId}/enrollment`);
    return data;
};

export const getInvoicesByMemberId = async (memberId: string): Promise<Invoice[]> => {
    const { data } = await apiClient.get<Invoice[]>(`/api/members/${memberId}/invoices`);
    return data;
};

export const globalSearch = async (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    if (!query) return { members: [], invoices: [] };
    const { data } = await apiClient.get<{ members: Member[], invoices: Invoice[] }>(`/api/search`, { params: { q: query } });
    return data;
};

interface StudentProfileData {
    member: Member;
    enrollment: Enrollment | null;
    invoices: Invoice[];
    plan: Plan | null;
}

export const getStudentProfileData = async (studentId: string): Promise<StudentProfileData> => {
    const { data } = await apiClient.get<StudentProfileData>(`/api/portal/profile/${studentId}`);
    return data;
};

export const updateStudentProfile = async (studentId: string, profileData: { email?: string; telefone?: string }): Promise<Member> => {
    const { data } = await apiClient.put<Member>(`/api/portal/profile/${studentId}`, profileData);
    return data;
};