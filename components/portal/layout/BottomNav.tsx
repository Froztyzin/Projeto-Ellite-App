import React from 'react';
import { NavLink } from 'react-router-dom';
import { menuItems } from '../navigation';

const BottomNav: React.FC = () => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-slate-700 flex justify-around p-1 z-40">
            {menuItems.map(item => (
                 <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full p-2 rounded-lg transition-colors duration-200 ${
                        isActive ? 'text-primary-500' : 'text-slate-400 hover:bg-slate-700'
                        }`
                    }
                >
                    <item.icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
