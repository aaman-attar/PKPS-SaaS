import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Building2, Users, LogOut, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Menu, X, Sparkles } from 'lucide-react';

export const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[#050813] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      
      {/* Top Navbar Header */}
      <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800/80 text-cyan-400 hover:bg-slate-700 transition"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* PC Desktop Sidebar Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          {/* Logo Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25 shrink-0">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div>
            <h1 className="font-extrabold text-base md:text-lg bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
              PKPS SaaS Super Admin
            </h1>
            <p className="text-[11px] text-cyan-400/80 font-medium hidden sm:block">
              Multi-Tenant Cloud Platform Operations
            </p>
          </div>
        </div>

        {/* User Info & Log Out */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-bold text-slate-100">{user?.first_name} {user?.last_name}</div>
            <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">SUPER ADMIN</div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 transition shadow"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Mobile Slide-Over Drawer */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div 
              className="w-72 max-w-[80vw] h-full bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-sm text-cyan-300">Admin Control</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                          active
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-900/50 text-xs text-slate-400">
                <div className="font-bold text-cyan-400">SaaS Multi-Tenant Core</div>
                <div className="text-slate-500 text-[11px]">Version 1.0.0 Active</div>
              </div>
            </div>
          </div>
        )}

        {/* PC Desktop Navigation Sidebar */}
        <aside
          className={`hidden md:flex ${
            isCollapsed ? 'w-20' : 'w-64'
          } bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/80 p-4 flex-col justify-between transition-all duration-300 ease-in-out shrink-0`}
        >
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 ring-1 ring-cyan-400/40'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0 stroke-[2.2]" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {!isCollapsed && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-xs text-slate-400 shadow">
              <div className="font-bold text-cyan-400">Platform Management</div>
              <div className="text-slate-500 text-[11px]">System Status: Operational</div>
            </div>
          )}
        </aside>

        {/* Main Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#050813] mb-16 md:mb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (< md) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex justify-around items-center px-2 py-2 md:hidden shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-4 rounded-xl transition ${
                active ? 'text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
