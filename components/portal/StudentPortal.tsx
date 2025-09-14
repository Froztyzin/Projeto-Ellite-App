import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentHeader from './layout/StudentHeader';
import PageLoader from '../shared/skeletons/PageLoader';

const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const StudentInvoices = React.lazy(() => import('./pages/StudentInvoices'));
const StudentProfile = React.lazy(() => import('./pages/StudentProfile'));

const StudentPortal: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <StudentHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="invoices" element={<StudentInvoices />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default StudentPortal;