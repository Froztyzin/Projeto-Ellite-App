import { Member, Enrollment, Invoice, Plan } from '../../types';
import apiClient from '../apiClient';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export const getMembers = async (query?: string, statusFilter: StatusFilter = 'ACTIVE'): Promise<Member[]> => {
    const response = await apiClient.get('/members', { params: { query, status: statusFilter } });
    return response.data;
};

export const addMember = async (memberData: Omit<Member, 'id' | 'ativo'>, planId: string | null): Promise<Member> => {
    const response = await apiClient.post('/members', { memberData, planId });
    return response.data;
};

export const updateMember = async (memberData: Member, planId?: string | null): Promise<Member> => {
    const response = await apiClient.put(`/members/${memberData.id}`, { memberData, planId });
    return response.data;
};

export const toggleMemberStatus = async (memberId: string): Promise<Member> => {
    const response = await apiClient.patch(`/members/${memberId}/status`);
    return response.data;
};

export const deleteMember = async (memberId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/members/${memberId}`);
    return response.data;
};

export const getMemberById = async (id: string): Promise<Member | undefined> => {
    const response = await apiClient.get(`/members/${id}`);
    return response.data;
};

export const getEnrollmentByMemberId = async (memberId: string): Promise<Enrollment | undefined> => {
    const response = await apiClient.get(`/members/${memberId}/enrollment`);
    return response.data;
};

export const getInvoicesByMemberId = async (memberId: string): Promise<Invoice[]> => {
    const response = await apiClient.get(`/members/${memberId}/invoices`);
    return response.data;
};

export const globalSearch = async (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    const response = await apiClient.get('/search', { params: { q: query }});
    return response.data;
};

interface StudentProfileData {
    member: Member;
    enrollment: Enrollment | null;
    invoices: Invoice[];
    plan: Plan | null;
}

export const getStudentProfileData = async (studentId: string): Promise<StudentProfileData> => {
    const response = await apiClient.get(`/portal/profile/${studentId}`);
    return response.data;
};

export const updateStudentProfile = async (studentId: string, profileData: { email?: string; telefone?: string }): Promise<Member> => {
    const response = await apiClient.put(`/portal/profile/${studentId}`, profileData);
    return response.data;
};