import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLogs } from '../../services/mockApi';
import { AuditLog, LogActionType } from '../../types';
import { formatDate, getLogActionBadge } from '../../lib/utils';
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa';
import Pagination from '../shared/Pagination';
import EmptyState from '../shared/EmptyState';
import SkeletonTable from '../shared/skeletons/SkeletonTable';
import { useDebounce } from '../../hooks/useDebounce';

const ITEMS_PER_PAGE = 20;

const LogRow = React.memo(({ log }: { log: AuditLog }) => {
    return (
        <tr className="hover:bg-slate-700/50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatDate(new Date(log.timestamp))}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-100">{log.userName}</div>
                <div className="text-xs text-slate-500">{log.userRole}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">{getLogActionBadge(log.action)}</td>
            <td className="px-6 py-4 whitespace-normal text-sm text-slate-300">{log.details}</td>
        </tr>
    );
});
LogRow.displayName = 'LogRow';

const Logs: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [actionFilter, setActionFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    
    const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
      queryKey: ['logs'],
      queryFn: getLogs,
    });

    const filteredLogs = useMemo(() => {
        let tempLogs = logs;
        
        if (actionFilter !== 'ALL') {
            tempLogs = tempLogs.filter(log => log.action === actionFilter);
        }
        if (debouncedSearchQuery) {
            const lowercasedQuery = debouncedSearchQuery.toLowerCase();
            tempLogs = tempLogs.filter(log => 
                log.details.toLowerCase().includes(lowercasedQuery) ||
                log.userName.toLowerCase().includes(lowercasedQuery)
            );
        }
        return tempLogs;
    }, [logs, actionFilter, debouncedSearchQuery]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredLogs, currentPage]);

    const handleClearFilters = useCallback(() => {
        setActionFilter('ALL');
        setSearchQuery('');
        setCurrentPage(1);
    }, []);

    return (
        <div className="bg-card p-4 sm:p-6 rounded-lg border border-slate-700 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-6">Log de Atividades</h1>

            <div className="flex flex-col md:flex-row items-center gap-4 p-4 mb-6 bg-slate-900/50 rounded-lg border border-slate-700 flex-wrap">
                <div className="relative w-full md:w-auto md:flex-grow">
                    <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por detalhes ou usuário..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <select 
                        value={actionFilter} 
                        onChange={(e) => setActionFilter(e.target.value)} 
                        className="block w-full rounded-md border-slate-600 bg-slate-700 text-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2"
                        aria-label="Filtrar por ação"
                    >
                        <option value="ALL">Todas as Ações</option>
                        {Object.values(LogActionType).map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={handleClearFilters} 
                    className="w-full md:w-auto flex items-center justify-center bg-slate-600 text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-500 transition text-sm font-medium"
                >
                    <FaTimes className="mr-2" /> Limpar Filtros
                </button>
            </div>
            
            {isLoading ? <SkeletonTable headers={['Data/Hora', 'Usuário', 'Ação', 'Detalhes']} /> : (
            <div className="overflow-x-auto">
                {paginatedLogs.length > 0 ? (
                <>
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Data/Hora</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Usuário</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Ação</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-slate-700">
                            {paginatedLogs.map((log) => (
                                <LogRow key={log.id} log={log} />
                            ))}
                        </tbody>
                    </table>
                    <Pagination 
                        currentPage={currentPage}
                        totalCount={filteredLogs.length}
                        pageSize={ITEMS_PER_PAGE}
                        onPageChange={page => setCurrentPage(page)}
                    />
                </>
                ) : (
                    <EmptyState 
                        title="Nenhum log encontrado"
                        message="Não há logs correspondentes aos filtros selecionados, ou nenhuma atividade foi registrada ainda."
                        icon={<FaFilter />}
                    />
                )}
            </div>
            )}
        </div>
    );
};

export default Logs;
