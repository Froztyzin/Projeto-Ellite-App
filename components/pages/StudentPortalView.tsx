import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMembers } from '../../services/api/members';
import { FaSearch } from 'react-icons/fa';
import StudentPortal from '../portal/StudentPortal';
import PageLoader from '../shared/skeletons/PageLoader';

const StudentPortalView: React.FC = () => {
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: members = [], isLoading } = useQuery({
        queryKey: ['members', 'ALL'], // Fetch all members for the selector
        queryFn: () => getMembers('', 'ALL'),
    });

    const filteredMembers = members.filter(member => 
        member.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Visualização do Portal do Aluno</h1>
            
            <div className="mb-6 max-w-lg p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <label htmlFor="student-select" className="block mb-2 text-sm font-medium text-slate-300">
                    Selecione um Aluno
                </label>
                <div className="relative">
                    <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar aluno por nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 mb-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                {isLoading ? (
                    <div className="text-slate-400">Carregando alunos...</div>
                ) : (
                    <select
                        id="student-select"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="block w-full rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2.5"
                    >
                        <option value="">-- Escolha um aluno --</option>
                        {filteredMembers.map(member => (
                            <option key={member.id} value={member.id}>
                                {member.nome}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="border-t border-slate-700 pt-6">
                {selectedStudentId ? (
                    <div className="bg-background rounded-lg p-2 border border-slate-600">
                         <React.Suspense fallback={<PageLoader />}>
                            <StudentPortal studentId={selectedStudentId} isEmbedded={true} />
                         </React.Suspense>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400">
                        <p>Selecione um aluno acima para visualizar seu portal.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPortalView;
