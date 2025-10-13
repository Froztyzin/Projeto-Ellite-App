import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Login from './components/pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { Role } from './types';
import ToastContainer from './components/shared/ToastContainer';
import AssistantFAB from './components/shared/AssistantFAB';
import AssistantModal from './components/shared/AssistantModal';
import { useToast } from './contexts/ToastContext';
import { useQuery } from '@tanstack/react-query';
import { generateNotifications } from './services/mockApi';
import PageLoader from './components/shared/skeletons/PageLoader';
import { useSettings } from './contexts/SettingsContext';

// Lazy load page components
const Dashboard = React.lazy(() => import('./components/pages/Dashboard'));
const Members = React.lazy(() => import('./components/pages/Members'));
const MemberProfile = React.lazy(() => import('./components/pages/MemberProfile'));
const Invoices = React.lazy(() => import('./components/pages/Invoices'));
const Expenses = React.lazy(() => import('./components/pages/Expenses'));
const Reports = React.lazy(() => import('./components/pages/Reports'));
const Settings = React.lazy(() => import('./components/pages/Settings'));
const Plans = React.lazy(() => import('./components/pages/Plans'));
const Notifications = React.lazy(() => import('./components/pages/Notifications'));
const Calendar = React.lazy(() => import('./components/pages/Calendar'));
const Logs = React.lazy(() => import('./components/pages/Logs'));
const Users = React.lazy(() => import('./components/pages/Users'));
const ForgotPassword = React.lazy(() => import('./components/pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./components/pages/ResetPassword'));


// Lazy load Student Portal component
const StudentPortal = React.lazy(() => import('./components/portal/StudentPortal'));


const AdminApp: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main>
                <ToastContainer />
                <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
                        <Route path="/members/:id" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
                        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                        <Route path="/calendar" element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.FINANCEIRO, Role.RECEPCAO]}><Calendar /></ProtectedRoute>} />
                        <Route path="/expenses" element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.FINANCEIRO]}><Expenses /></ProtectedRoute>} />
                        <Route path="/reports" element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.FINANCEIRO]}><Reports /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.FINANCEIRO]}><Settings /></ProtectedRoute>} />
                        <Route path="/settings/plans" element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.FINANCEIRO]}><Plans /></ProtectedRoute>} />
                        <Route path="/settings/users" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><Users /></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.FINANCEIRO]}><Notifications /></ProtectedRoute>} />
                        <Route path="/logs" element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.FINANCEIRO]}><Logs /></ProtectedRoute>} />
                        {/* Redirect any non-portal routes to the admin dashboard */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Suspense>
                </div>
                </main>
                <AssistantFAB onClick={() => setIsAssistantOpen(true)} />
                <AssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
            </div>
        </div>
    );
}


const App: React.FC = () => {
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const { settings, loading: settingsLoading } = useSettings();

  useEffect(() => {
    if (settings?.gymName) {
      document.title = settings.gymName;
    }
  }, [settings?.gymName]);


  // Background Notification Service using React Query for polling
  useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!settings) return null;
      const result = await generateNotifications(settings);
      if (result.generatedCount > 0) {
          addToast(`${result.generatedCount} novas notificações geradas.`, 'info');
      }
      return result;
    },
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    enabled: !!user && user.role !== Role.ALUNO && !!settings, // Only run for admin users and when settings are loaded
    refetchOnMount: true,
  });
  
  if (loading || settingsLoading) {
    return <PageLoader />;
  }

  if (!user) {
     return (
        <>
            <ToastContainer />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/" element={<ResetPassword />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Suspense>
        </>
     )
  }

  // User is logged in, determine which app to show
  if (user.role === Role.ALUNO) {
    return (
         <>
            <ToastContainer />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/portal/*" element={<ProtectedRoute allowedRoles={[Role.ALUNO]}><StudentPortal /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/portal/dashboard" replace />} />
                </Routes>
            </Suspense>
        </>
    );
  } else {
     // Admin, Financeiro, etc.
     return <AdminApp />;
  }
};

export default App;
