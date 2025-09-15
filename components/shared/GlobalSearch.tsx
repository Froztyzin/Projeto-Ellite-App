import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalSearch } from '../../services/api/members';
import { Member, Invoice } from '../../types';
import { FaSearch, FaUser, FaFileInvoiceDollar, FaSpinner } from 'react-icons/fa';

const GlobalSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ members: Member[], invoices: Invoice[] }>({ members: [], invoices: [] });
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const debounce = (func: (...args: any[]) => void, delay: number) => {
        let timeout: ReturnType<typeof setTimeout>;
        return (...args: any[]) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    const performSearch = useCallback(
        async (searchQuery: string) => {
            if (searchQuery.length < 2) {
                setResults({ members: [], invoices: [] });
                setIsOpen(false);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const searchResults = await globalSearch(searchQuery);
                setResults(searchResults);
                setIsOpen(true);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const debouncedSearch = useCallback(debounce(performSearch, 500), [performSearch]);

    useEffect(() => {
        debouncedSearch(query);
    }, [query, debouncedSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleItemClick = (path: string) => {
        setQuery('');
        setIsOpen(false);
        navigate(path);
    };

    const highlightMatch = (text: string, highlight: string) => {
        if (!highlight.trim()) {
            return <span>{text}</span>;
        }
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, i) =>
                    regex.test(part) ? <strong key={i} className="text-primary-400">{part}</strong> : <span key={i}>{part}</span>
                )}
            </span>
        );
    };

    const hasResults = results.members.length > 0 || results.invoices.length > 0;

    return (
        <div className="relative w-full max-w-md" ref={searchRef}>
            <div className="relative">
                <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 1 && setIsOpen(true)}
                    placeholder="Buscar alunos, faturas..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    aria-label="Busca Global"
                />
                {loading && <FaSpinner className="absolute top-1/2 right-3 transform -translate-y-1/2 text-slate-400 animate-spin" />}
            </div>

            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-slate-700 rounded-lg shadow-lg border border-slate-600 z-50 max-h-96 overflow-y-auto">
                    {hasResults ? (
                        <div>
                            {results.members.length > 0 && (
                                <div className="p-2">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase px-3 pt-2 pb-1">Alunos</h3>
                                    <ul>
                                        {results.members.map(member => (
                                            <li key={member.id} onClick={() => handleItemClick(`/members/${member.id}`)}
                                                className="flex items-center px-3 py-2 text-sm text-slate-200 hover:bg-slate-600 rounded-md cursor-pointer"
                                            >
                                                <FaUser className="mr-3 text-slate-400" />
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{highlightMatch(member.nome, query)}</p>
                                                    <p className="text-xs text-slate-400 truncate">{member.email}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             {results.invoices.length > 0 && (
                                <div className="p-2">
                                     <h3 className="text-xs font-semibold text-slate-400 uppercase px-3 pt-2 pb-1">Faturas</h3>
                                    <ul>
                                        {results.invoices.map(invoice => (
                                            <li key={invoice.id} onClick={() => handleItemClick(`/invoices`)}
                                                className="flex items-center px-3 py-2 text-sm text-slate-200 hover:bg-slate-600 rounded-md cursor-pointer"
                                            >
                                                <FaFileInvoiceDollar className="mr-3 text-slate-400" />
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">Fatura para {highlightMatch(invoice.member.nome, query)}</p>
                                                    <p className="text-xs text-slate-400 truncate">Vencimento: {new Date(invoice.vencimento).toLocaleDateString('pt-BR')} - {invoice.status}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                         <div className="p-4 text-center text-sm text-slate-400">
                           Nenhum resultado encontrado para "{query}".
                         </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;