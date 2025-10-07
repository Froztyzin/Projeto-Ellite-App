

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaChartPie, FaUsers, FaFileInvoiceDollar, FaMoneyBillWave, FaChartLine, FaCog, FaTachometerAlt, FaHistory, FaCalendarAlt, FaBell
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const allMenuItems = [
    { href: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard', roles: [Role.ADMIN, Role.FINANCEIRO, Role.RECEPCAO, Role.INSTRUTOR], end: true },
    { href: '/members', icon: FaUsers, label: 'Alunos', roles: [Role.ADMIN, Role.FINANCEIRO, Role.RECEPCAO, Role.INSTRUTOR] },
    { href: '/invoices', icon: FaFileInvoiceDollar, label: 'Faturas', roles: [Role.ADMIN, Role.FINANCEIRO, Role.RECEPCAO], end: true },
    { href: '/calendar', icon: FaCalendarAlt, label: 'Calendário', roles: [Role.ADMIN, Role.FINANCEIRO, Role.RECEPCAO], end: true },
    { href: '/expenses', icon: FaMoneyBillWave, label: 'Despesas', roles: [Role.ADMIN, Role.FINANCEIRO], end: true },
    { href: '/reports', icon: FaChartLine, label: 'Relatórios', roles: [Role.ADMIN, Role.FINANCEIRO], end: true },
    { href: '/notifications', icon: FaBell, label: 'Notificações', roles: [Role.ADMIN, Role.FINANCEIRO], end: true },
    { href: '/logs', icon: FaHistory, label: 'Log de Atividades', roles: [Role.ADMIN, Role.FINANCEIRO], end: true },
    { href: '/settings', icon: FaCog, label: 'Configurações', roles: [Role.ADMIN, Role.FINANCEIRO] },
];


const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { settings } = useSettings();

  const menuItems = React.useMemo(() => {
    if (!user) return [];
    // Adiciona o papel de INSTRUTOR em alguns menus
    const updatedMenuItems = allMenuItems.map(item => {
        if (['/dashboard', '/members'].includes(item.href) && !item.roles.includes(Role.INSTRUTOR)) {
            return { ...item, roles: [...item.roles, Role.INSTRUTOR] };
        }
        return item;
    });
    return updatedMenuItems.filter(item => item.roles.includes(user.role));
  }, [user]);

  return (
    <>
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 bg-gray-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      ></div>

      <div
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-screen overflow-y-auto w-64 lg:w-72 bg-sidebar text-gray-200 shrink-0 transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <div className="flex items-center">
            <FaChartPie className="text-3xl text-primary-500" />
            <h1 className="ml-3 text-xl font-semibold text-white">{settings?.gymName || 'Academia'}</h1>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4">
          <ul>
            {menuItems.map((item) => (
              <li key={item.href} className="mb-2">
                <NavLink
                  to={item.href}
                  end={!!item.end}
                  className={({ isActive }) =>
                    'flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors ' +
                    (isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white')
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="text-lg" />
                  <span className="ml-4 font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;