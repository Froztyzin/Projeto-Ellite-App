import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { FaTachometerAlt, FaFileInvoiceDollar, FaUser, FaSignOutAlt, FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';

const StudentHeader: React.FC = () => {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);

    const menuItems = [
        { to: "/portal/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
        { to: "/portal/invoices", icon: FaFileInvoiceDollar, label: "Minhas Faturas" },
        { to: "/portal/profile", icon: FaUser, label: "Meu Perfil" },
    ];

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center w-full px-4 py-2 text-sm rounded-md transition-colors ${
        isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`;
    
    const dropdownLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors ${
        isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-600 hover:text-white'
        }`;

    return (
        <header className="bg-card border-b border-slate-700 sticky top-0 z-30" ref={headerRef}>
            <div className="mx-auto max-w-screen-2xl px-4 md:px-6 2xl:px-10">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <FaTachometerAlt className="text-2xl text-primary-500" />
                        <h1 className="ml-3 text-lg font-semibold text-white">Portal do Aluno</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Desktop User Dropdown */}
                        <div className="hidden md:block relative">
                            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-700" aria-haspopup="true" aria-expanded={dropdownOpen}>
                                <FaUserCircle className="w-7 h-7 text-slate-400" />
                                <span className="font-semibold text-slate-200 truncate">{user?.nome.split(' ')[0]}</span>
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-60 bg-slate-700 rounded-md shadow-lg border border-slate-600 z-10">
                                    <div className="p-2">
                                        <div className="px-2 py-2">
                                            <p className="font-semibold text-sm text-slate-100 truncate">{user?.nome}</p>
                                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                        </div>
                                        <div className="border-t border-slate-600 my-1"></div>
                                        <nav className="space-y-1">
                                            {menuItems.map(item => (
                                                <NavLink key={item.to} to={item.to} className={dropdownLinkClasses} onClick={() => setDropdownOpen(false)}>
                                                    <item.icon className="mr-3 text-slate-400" /> {item.label}
                                                </NavLink>
                                            ))}
                                        </nav>
                                        <div className="border-t border-slate-600 my-1"></div>
                                        <button onClick={logout} className="w-full text-left flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-900/50 rounded-md">
                                            <FaSignOutAlt className="mr-3" /> Sair
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-400 hover:text-slate-200 p-2 rounded-md">
                                {menuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden bg-card border-t border-slate-700">
                    <nav className="p-4 space-y-2">
                         {menuItems.map(item => (
                            <NavLink key={item.to} to={item.to} className={navLinkClasses} onClick={() => setMenuOpen(false)}>
                                <item.icon className="mr-2" /> {item.label}
                            </NavLink>
                        ))}
                        <div className="border-t border-slate-700 pt-3 mt-2">
                            <div className="flex items-center px-4 mb-3">
                                <span className="text-sm text-slate-400">Olá,</span>
                                <span className="ml-1 font-semibold text-slate-200 truncate">{user?.nome}</span>
                            </div>
                            <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-red-400 bg-red-900/20 hover:bg-red-900/50">
                                <FaSignOutAlt className="mr-2" /> Sair
                            </button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default StudentHeader;