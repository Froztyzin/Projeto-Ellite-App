import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import GlobalSearch from '../shared/GlobalSearch';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getNotificationHistory } from '../../services/api/notifications';

interface HeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: notifications = [] } = useQuery({
        queryKey: ['notificationHistory'],
        queryFn: getNotificationHistory,
        enabled: !!user,
        refetchInterval: 30000, // Check for new notifications periodically
    });

    const [lastView, setLastView] = useState(localStorage.getItem('lastNotificationView') || new Date(0).toISOString());

    const unreadCount = notifications.filter(n => new Date(n.sentAt) > new Date(lastView)).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = () => {
        const newTimestamp = new Date().toISOString();
        localStorage.setItem('lastNotificationView', newTimestamp);
        setLastView(newTimestamp);
        navigate('/notifications');
    };

  return (
    <header className="sticky top-0 bg-card border-b border-slate-700 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 -mb-px">
          <div className="flex items-center">
            <button
              className="text-slate-400 hover:text-slate-300 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <FaBars className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex justify-center px-4">
             <GlobalSearch />
          </div>

          <div className="flex items-center space-x-3 sm:space-x-5">
             <div className="relative">
                <button 
                    onClick={handleNotificationClick}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600"
                    aria-label={`${unreadCount} novas notificações`}
                >
                    <FaBell className="w-5 h-5 text-slate-400" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-card">
                            {unreadCount}
                        </span>
                    )}
                </button>
             </div>
             <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-3 cursor-pointer"
                >
                    <FaUserCircle className="w-8 h-8 text-slate-500" />
                    <div className="min-w-0">
                        <div className="font-semibold text-slate-200 truncate">{user?.nome || 'Usuário'}</div>
                        <div className="hidden sm:block text-xs text-slate-400 truncate">{user?.email || ''}</div>
                    </div>
                </button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-md shadow-lg border border-slate-600 z-10">
                        <ul className="py-1">
                            <li>
                                <button onClick={logout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-900/50">
                                   <FaSignOutAlt className="mr-3" /> Sair
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;