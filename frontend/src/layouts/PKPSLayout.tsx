import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building, Users, CreditCard, Landmark, PiggyBank, BookOpen, 
  ShieldCheck, LogOut, LayoutDashboard, FileText
} from 'lucide-react';

export const PKPSLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Society Dashboard', path: '/pkps/dashboard', icon: LayoutDashboard },
    { label: 'Members & KYC', path: '/pkps/members', icon: Users },
    { label: 'Loans & Recovery', path: '/pkps/loans', icon: CreditCard },
    { label: 'Share Capital', path: '/pkps/shares', icon: Landmark },
    { label: 'Deposits & Savings', path: '/pkps/deposits', icon: PiggyBank },
    { label: 'Financial Accounting', path: '/pkps/accounting', icon: BookOpen },
    { label: 'Audit Trail', path: '/pkps/audit', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-emerald-400">
              {user?.tenant?.name || 'PKPS Management System'}
            </h1>
            <p className="text-xs text-slate-400">PACS Registration: {user?.tenant?.registration_number || 'PACS/2026'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-200">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-emerald-400 font-mono">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900/50 border-r border-slate-800 p-4 flex flex-col justify-between">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">{user?.tenant?.village || 'Mandya'} Branch</div>
            <div className="text-slate-500">Tenant ID: {user?.tenant?.code}</div>
          </div>
        </aside>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
