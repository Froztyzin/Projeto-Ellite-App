import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaChartPie } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { menuItems } from '../navigation';

const StudentSidebar: React.FC = () => {
    const { user } = useAuth();
    const { settings } = useSettings();
    
    return (
        <aside className="hidden md:flex flex-col w-64 h-screen px-4 py-8 bg-card border-r border-slate-700 fixed overflow-y-auto">
             <div className="flex items-center justify-center mb-10">
                <FaChartPie className="text-4xl text-primary-500" />
                <h1 className="ml-3 text-2xl font-bold text-white">{settings?.gymName || 'Academia'}</h1>
            </div>
            <nav className="flex flex-col flex-1">
                {menuItems.map(item => (
                    <NavLink
                        key={item.label}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 mb-2 rounded-lg transition-colors duration-200 ${
                            isActive ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="ml-4 font-semibold">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center">
                    <div>
                        <p className="font-semibold text-slate-200 truncate">{user?.nome}</p>
                        <p className="text-sm text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default StudentSidebar;
