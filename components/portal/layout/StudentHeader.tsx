import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

interface StudentHeaderProps {
  pageTitle: string;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({ pageTitle }) => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    return (
        <header className="bg-card/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-8">
            <h1 className="text-xl font-semibold text-slate-100 md:hidden">{pageTitle}</h1>
            <div className="hidden md:block"></div> {/* Spacer */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-slate-700"
                    aria-haspopup="true" aria-expanded={dropdownOpen}
                >
                    <FaUserCircle className="w-8 h-8 text-slate-400" />
                </button>
                 {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-md shadow-lg border border-slate-600 z-10">
                        <div className="p-2">
                             <div className="px-2 py-1">
                                <p className="font-semibold text-sm text-slate-100 truncate">{user?.nome}</p>
                             </div>
                             <div className="border-t border-slate-600 my-1"></div>
                             <button onClick={logout} className="w-full text-left flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-900/50 rounded-md">
                                <FaSignOutAlt className="mr-3" /> Sair
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default StudentHeader;
