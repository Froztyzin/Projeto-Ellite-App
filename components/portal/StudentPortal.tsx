import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StudentHeader from './layout/StudentHeader';
import PageLoader from '../shared/skeletons/PageLoader';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from './layout/StudentSidebar';
import BottomNav from './layout/BottomNav';
import { menuItems } from './navigation';

const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const StudentInvoices = React.lazy(() => import('./pages/StudentInvoices'));
const StudentProfile = React.lazy(() => import('./pages/StudentProfile'));
const StudentNotifications = React.lazy(() => import('./pages/StudentNotifications'));


interface StudentPortalProps {
    studentId?: string;
    isEmbedded?: boolean;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ studentId, isEmbedded = false }) => {
  const location = useLocation();
  const { user } = useAuth();

  const effectiveStudentId = studentId || user?.id;

  if (!effectiveStudentId) {
    return <PageLoader />;
  }

  const getPageTitle = () => {
    const currentItem = menuItems.find(item => location.pathname.startsWith(item.to));
    return currentItem ? currentItem.label : 'Portal do Aluno';
  };

  const portalContent = (
    <main className={`flex-1 ${!isEmbedded ? 'pb-20 md:pb-0' : ''}`}>
      <div className={isEmbedded ? '' : 'mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10'}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="dashboard" element={<StudentDashboard studentId={effectiveStudentId} />} />
            <Route path="invoices" element={<StudentInvoices studentId={effectiveStudentId} />} />
            <Route path="profile" element={<StudentProfile studentId={effectiveStudentId} />} />
            <Route path="notifications" element={<StudentNotifications studentId={effectiveStudentId} />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </main>
  );

  if (isEmbedded) {
    return portalContent;
  }

  return (
    <div className="flex min-h-screen bg-background text-slate-300">
      <StudentSidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <StudentHeader pageTitle={getPageTitle()} />
        {portalContent}
        <BottomNav />
      </div>
    </div>
  );
};

export default StudentPortal;