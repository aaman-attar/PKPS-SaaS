import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Building2, Users, Settings, LogOut, LayoutDashboard } from 'lucide-react';

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'SaaS Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'PKPS Tenants', path: '/admin/tenants', icon: Building2 },
    { label: 'Platform Users', path: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              PKPS SaaS Super Admin
            </h1>
            <p className="text-xs text-slate-400">Platform Control & Management</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-200">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-blue-400 font-mono">SUPER ADMIN</div>
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

      {/* Main Content Area */}
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
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500 space-y-1">
            <div>Version: 1.0.0 Stable</div>
            <div>Multi-Tenant Core Active</div>
          </div>
        </aside>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
