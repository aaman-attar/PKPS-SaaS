import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ActivateAccountPage } from './pages/auth/ActivateAccountPage';

import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { SuperAdminDashboard } from './pages/saas_admin/SuperAdminDashboard';
import { TenantsListPage } from './pages/saas_admin/TenantsListPage';
import { UsersListPage } from './pages/saas_admin/UsersListPage';

import { PKPSLayout } from './layouts/PKPSLayout';
import { PKPSDashboard } from './pages/pkps_admin/PKPSDashboard';
import { MembersListPage } from './pages/pkps_admin/MembersListPage';
import { MembershipApplicationsPage } from './pages/pkps_admin/MembershipApplicationsPage';
import { LoansManagementPage } from './pages/pkps_admin/LoansManagementPage';
import { SharesManagementPage } from './pages/pkps_admin/SharesManagementPage';
import { DepositsManagementPage } from './pages/pkps_admin/DepositsManagementPage';
import { AccountingPage } from './pages/pkps_admin/AccountingPage';
import { AuditLogPage } from './pages/pkps_admin/AuditLogPage';
import { BlockchainLedgerPage } from './pages/pkps_admin/BlockchainLedgerPage';
import { GovernancePage } from './pages/pkps_admin/GovernancePage';
import { DocumentsPage } from './pages/pkps_admin/DocumentsPage';
import { NotificationsPage } from './pages/pkps_admin/NotificationsPage';
import { ReportsPage } from './pages/pkps_admin/ReportsPage';

import { FarmerLayout } from './layouts/FarmerLayout';
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { FarmerLoansPage } from './pages/farmer/FarmerLoansPage';
import { FarmerSavingsPage } from './pages/farmer/FarmerSavingsPage';
import { ApplyMembershipPage } from './pages/farmer/ApplyMembershipPage';

const getHomeRouteForRole = (role?: string): string => {
  const normalized = (role || '').toUpperCase().trim();
  if (['SUPER_ADMIN', 'SUPPORT_ADMIN'].includes(normalized)) return '/admin/dashboard';
  if (normalized === 'FARMER') return '/farmer/dashboard';
  return '/pkps/dashboard';
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizedUserRole = (user.role || '').toUpperCase().trim();
  const normalizedAllowed = allowedRoles?.map((r) => r.toUpperCase().trim());

  if (normalizedAllowed && !normalizedAllowed.includes(normalizedUserRole)) {
    const targetHome = getHomeRouteForRole(normalizedUserRole);

    // Prevent redirect deadlock if already at target home
    if (location.pathname === targetHome) {
      return (
        <div className="min-h-screen bg-[#060913] text-slate-100 flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl">
            <h2 className="text-xl font-bold text-red-400 mb-2">Access Restricted</h2>
            <p className="text-sm text-slate-400 mb-6">
              Your account role ({user.role || 'Unknown'}) does not have permission to access this module.
            </p>
            <a
              href="/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition"
            >
              Return to Login
            </a>
          </div>
        </div>
      );
    }

    return <Navigate to={targetHome} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate" element={<ActivateAccountPage />} />
      <Route path="/accept-invitation" element={<ActivateAccountPage />} />

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
        <Route path="users" element={<UsersListPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* PKPS ERP Society Management Portal */}
      <Route
        path="/pkps"
        element={
          <ProtectedRoute
            allowedRoles={[
              'SUPER_ADMIN', 'SUPPORT_ADMIN',
              'PKPS_ADMIN', 'SECRETARY', 'MANAGER', 'ACCOUNTANT',
              'LOAN_OFFICER', 'CASHIER', 'STAFF', 'AUDITOR', 'COMMITTEE'
            ]}
          >
            <PKPSLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PKPSDashboard />} />
        <Route path="applications" element={<MembershipApplicationsPage />} />
        <Route path="members" element={<MembersListPage />} />
        <Route path="loans" element={<LoansManagementPage />} />
        <Route path="shares" element={<SharesManagementPage />} />
        <Route path="deposits" element={<DepositsManagementPage />} />
        <Route path="accounting" element={<AccountingPage />} />
        <Route path="governance" element={<GovernancePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditLogPage />} />
        <Route path="blockchain" element={<BlockchainLedgerPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>


      {/* Farmer Self-Service Portal */}
      <Route
        path="/farmer"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SUPPORT_ADMIN', 'FARMER']}>
            <FarmerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<FarmerDashboard />} />
        <Route path="apply" element={<ApplyMembershipPage />} />
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
