

import { Member, Enrollment, Invoice, Plan } from '../../types';

const API_URL = '/api'; // Assumes proxy or same-origin deployment

export const getMembers = async (query?: string, statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ACTIVE'): Promise<Member[]> => {
    const params = new URLSearchParams({ statusFilter });
    if (query) params.append('query', query);
    
    const response = await fetch(`${API_URL}/members?${params.toString()}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch members');
    }
    return response.json();
};

export const addMember = async (newMemberData: Omit<Member, 'id' | 'ativo'>, planId: string | null): Promise<Member> => {
    const response = await fetch(`${API_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberData: newMemberData, planId }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add member');
    }
    return response.json();
};

export const updateMember = async (updatedMemberData: Member, planId?: string | null): Promise<Member> => {
    const response = await fetch(`${API_URL}/members/${updatedMemberData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberData: updatedMemberData, planId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to update member');
    }
    return response.json();
};

export const toggleMemberStatus = async (memberId: string): Promise<Member> => {
     const response = await fetch(`${API_URL}/members/${memberId}/toggle-status`, { method: 'POST' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to toggle member status');
    }
    return response.json();
};

export const deleteMember = async (memberId: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_URL}/members/${memberId}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to delete member');
    }
    return response.json();
};

export const getMemberById = async (id: string): Promise<Member | undefined> => {
    const response = await fetch(`${API_URL}/members/${id}`);
    if (!response.ok) {
        if (response.status === 404) return undefined;
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch member');
    }
    return response.json();
};

export const getEnrollmentByMemberId = async (memberId: string): Promise<Enrollment | undefined> => {
    const response = await fetch(`${API_URL}/members/${memberId}/enrollment`);
    if (!response.ok) {
        if (response.status === 404) return undefined;
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch enrollment');
    }
    return response.json();
};

export const getInvoicesByMemberId = async (memberId: string): Promise<Invoice[]> => {
    const response = await fetch(`${API_URL}/members/${memberId}/invoices`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch invoices for member');
    }
    return response.json();
};

export const globalSearch = async (query: string): Promise<{ members: Member[], invoices: Invoice[] }> => {
    if (!query) return { members: [], invoices: [] };
    const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Search failed');
    }
    return response.json();
};


interface StudentProfileData {
    member: Member;
    enrollment: Enrollment | null;
    invoices: Invoice[];
    plan: Plan | null;
}

export const getStudentProfileData = async (studentId: string): Promise<StudentProfileData> => {
    const response = await fetch(`${API_URL}/students/${studentId}/profile`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to fetch student profile');
    }
    return response.json();
};

export const updateStudentProfile = async (studentId: string, data: { email?: string; telefone?: string }): Promise<Member> => {
    const response = await fetch(`${API_URL}/students/${studentId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'Failed to update student profile');
    }
    return response.json();
};
