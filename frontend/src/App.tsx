import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';

import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { SuperAdminDashboard } from './pages/saas_admin/SuperAdminDashboard';
import { TenantsListPage } from './pages/saas_admin/TenantsListPage';

import { PKPSLayout } from './layouts/PKPSLayout';
import { PKPSDashboard } from './pages/pkps_admin/PKPSDashboard';
import { MembersListPage } from './pages/pkps_admin/MembersListPage';
import { LoansManagementPage } from './pages/pkps_admin/LoansManagementPage';
import { SharesManagementPage } from './pages/pkps_admin/SharesManagementPage';
import { DepositsManagementPage } from './pages/pkps_admin/DepositsManagementPage';
import { AccountingPage } from './pages/pkps_admin/AccountingPage';
import { AuditLogPage } from './pages/pkps_admin/AuditLogPage';

import { FarmerLayout } from './layouts/FarmerLayout';
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { FarmerLoansPage } from './pages/farmer/FarmerLoansPage';
import { FarmerSavingsPage } from './pages/farmer/FarmerSavingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (['SUPER_ADMIN', 'SUPPORT_ADMIN'].includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'FARMER') return <Navigate to="/farmer/dashboard" replace />;
    return <Navigate to="/pkps/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* SaaS Admin Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SUPPORT_ADMIN']}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="tenants" element={<TenantsListPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* PKPS ERP Society Management Portal */}
      <Route
        path="/pkps"
        element={
          <ProtectedRoute
            allowedRoles={[
              'PKPS_ADMIN', 'SECRETARY', 'MANAGER', 'ACCOUNTANT',
              'LOAN_OFFICER', 'CASHIER', 'STAFF', 'AUDITOR', 'COMMITTEE'
            ]}
          >
            <PKPSLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PKPSDashboard />} />
        <Route path="members" element={<MembersListPage />} />
        <Route path="loans" element={<LoansManagementPage />} />
        <Route path="shares" element={<SharesManagementPage />} />
        <Route path="deposits" element={<DepositsManagementPage />} />
        <Route path="accounting" element={<AccountingPage />} />
        <Route path="audit" element={<AuditLogPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Farmer Self-Service Portal */}
      <Route
        path="/farmer"
        element={
          <ProtectedRoute allowedRoles={['FARMER']}>
            <FarmerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<FarmerDashboard />} />
        <Route path="loans" element={<FarmerLoansPage />} />
        <Route path="savings" element={<FarmerSavingsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
