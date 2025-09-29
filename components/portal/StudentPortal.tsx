import React, { Suspense } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import StudentHeader from './layout/StudentHeader';
import PageLoader from '../shared/skeletons/PageLoader';
import { useAuth } from '../../contexts/AuthContext';
import { FaTachometerAlt, FaFileInvoiceDollar, FaUser, FaBell, FaChartPie, FaDumbbell } from 'react-icons/fa';

const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const StudentInvoices = React.lazy(() => import('./pages/StudentInvoices'));
const StudentProfile = React.lazy(() => import('./pages/StudentProfile'));
const StudentNotifications = React.lazy(() => import('./pages/StudentNotifications'));
const StudentWorkout = React.lazy(() => import('./pages/StudentWorkout'));


const menuItems = [
    { to: "/portal/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
    { to: "/portal/workout", icon: FaDumbbell, label: "Meu Treino" },
    { to: "/portal/invoices", icon: FaFileInvoiceDollar, label: "Faturas" },
    { to: "/portal/notifications", icon: FaBell, label: "Notificações" },
    { to: "/portal/profile", icon: FaUser, label: "Meu Perfil" },
];

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    return (
        <aside className="hidden md:flex flex-col w-64 h-screen px-4 py-8 bg-card border-r border-slate-700 fixed">
             <div className="flex items-center justify-center mb-10">
                <FaChartPie className="text-4xl text-primary-500" />
                <h1 className="ml-3 text-2xl font-bold text-white">Elitte Corpus</h1>
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

const StudentPortal: React.FC = () => {
  const location = useLocation();
  const getPageTitle = () => {
    const currentItem = menuItems.find(item => location.pathname.startsWith(item.to));
    return currentItem ? currentItem.label : 'Portal do Aluno';
  };

  return (
    <div className="flex min-h-screen bg-background text-slate-300">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <StudentHeader pageTitle={getPageTitle()} />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="workout" element={<StudentWorkout />} />
                <Route path="invoices" element={<StudentInvoices />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="notifications" element={<StudentNotifications />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default StudentPortal;