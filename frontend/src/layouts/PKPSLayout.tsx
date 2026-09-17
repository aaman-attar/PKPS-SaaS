import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building, Users, CreditCard, Landmark, PiggyBank, BookOpen, 
  ShieldCheck, LogOut, LayoutDashboard, PanelLeftClose, PanelLeftOpen,
  Menu, X, Sparkles, ClipboardCheck
} from 'lucide-react';

export const PKPSLayout: React.FC = () => {
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
    { label: 'Society Dashboard', path: '/pkps/dashboard', icon: LayoutDashboard },
    { label: 'Farmer Applications', path: '/pkps/applications', icon: ClipboardCheck },
    { label: 'Members & KYC', path: '/pkps/members', icon: Users },
    { label: 'Loans & Recovery', path: '/pkps/loans', icon: CreditCard },
    { label: 'Share Capital', path: '/pkps/shares', icon: Landmark },
    { label: 'Deposits & Savings', path: '/pkps/deposits', icon: PiggyBank },
    { label: 'Financial Accounting', path: '/pkps/accounting', icon: BookOpen },
    { label: 'Audit Trail', path: '/pkps/audit', icon: ShieldCheck },
  ];


  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navbar Header (PC & Mobile) */}
      <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          {/* Mobile Drawer Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800/80 text-emerald-400 hover:bg-slate-700 transition"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* PC Desktop Collapse Sidebar Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          {/* Logo Badge */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/25 shrink-0">
            <Building className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div>
            <h1 className="font-extrabold text-base md:text-lg bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-300 bg-clip-text text-transparent truncate max-w-[200px] sm:max-w-none">
              {user?.tenant?.name || 'PKPS Management System'}
            </h1>
            <p className="text-[11px] text-emerald-400/90 font-medium truncate hidden sm:block">
              PACS Reg: {user?.tenant?.registration_number || 'PACS/2026/KA'}
            </p>
          </div>
        </div>

        {/* User Info & Sign Out */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-slate-100">{user?.first_name} {user?.last_name}</div>
            <div className="text-[11px] text-emerald-400 font-bold tracking-wide uppercase">{user?.role}</div>
          </div>

          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs sm:hidden">
            {user?.first_name?.[0] || 'U'}
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition shadow"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Slide-Over Drawer Overlay */}
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
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm text-slate-200">PKPS Portal Navigation</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
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
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
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

              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
                <div className="font-bold text-emerald-400">{user?.tenant?.village || 'Mandya'} Society Branch</div>
                <div className="text-slate-500 mt-0.5">Tenant Code: {user?.tenant?.code}</div>
              </div>
            </div>
          </div>
        )}

        {/* PC Desktop Sidebar */}
        <aside
          className={`hidden md:flex ${
            isCollapsed ? 'w-20' : 'w-64'
          } bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/80 p-4 flex-col justify-between transition-all duration-300 ease-in-out shrink-0`}
        >
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                    active
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
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
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1 shadow">
              <div className="font-bold text-emerald-400">{user?.tenant?.village || 'Mandya'} PACS</div>
              <div className="text-slate-500 text-[11px]">Tenant ID: {user?.tenant?.code}</div>
            </div>
          )}
        </aside>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#060913] mb-16 md:mb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Quick Bar (< md) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 flex justify-around items-center px-2 py-1.5 md:hidden shadow-2xl">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
                active ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 truncate max-w-[64px]">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
