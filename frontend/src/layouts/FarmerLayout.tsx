import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, CreditCard, PiggyBank, Home, LogOut, PanelLeftClose, PanelLeftOpen, Menu, X, Wheat } from 'lucide-react';

export const FarmerLayout: React.FC = () => {
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
    { label: 'My Portal', path: '/farmer/dashboard', icon: Home },
    { label: 'My Loans & Tracker', path: '/farmer/loans', icon: CreditCard },
    { label: 'My Savings & Shares', path: '/farmer/savings', icon: PiggyBank },
  ];

  return (
    <div className="min-h-screen bg-[#050813] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Mobile-Friendly Navbar Header */}
      <header className="bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border-b border-emerald-800/40 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xl">
        <div className="flex items-center space-x-3">
          
          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-800 transition"
            aria-label="Toggle Mobile Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* PC Desktop Collapse Sidebar Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-2 rounded-xl bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-800 transition"
            title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          {/* Logo Badge */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-500 flex items-center justify-center font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
            <Wheat className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div>
            <h1 className="font-extrabold text-base md:text-lg bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              Farmer Self-Service Portal
            </h1>
            <p className="text-[11px] text-emerald-400/90 font-medium truncate max-w-[180px] sm:max-w-none">
              {user?.tenant?.name || 'PKPS Farmers Cooperative'}
            </p>
          </div>
        </div>

        {/* Profile & Sign Out */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-bold text-slate-100">{user?.first_name} {user?.last_name}</div>
            <div className="text-[11px] text-amber-400 font-semibold">✓ Verified Member Farmer</div>
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

        {/* Mobile Drawer Slide-Over */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div 
              className="w-72 max-w-[80vw] h-full bg-slate-900 border-r border-emerald-900/50 p-5 flex flex-col justify-between shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-sm text-amber-300">Farmer Menu</span>
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
                        className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition ${
                          active
                            ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-bold shadow-lg shadow-amber-500/25'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-800/40 text-xs text-slate-400">
                <div className="font-bold text-emerald-400">{user?.tenant?.name || 'Mandya PKPS'}</div>
                <div className="text-slate-500 text-[11px]">Direct Member Account</div>
              </div>
            </div>
          </div>
        )}

        {/* PC Desktop Navigation Sidebar */}
        <aside
          className={`hidden md:flex ${
            isCollapsed ? 'w-20' : 'w-64'
          } bg-slate-900/70 backdrop-blur-xl border-r border-slate-800/80 p-4 flex-col justify-between transition-all duration-300 ease-in-out shrink-0`}
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
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/25 ring-1 ring-amber-400/50'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0 stroke-[2.2]" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {!isCollapsed && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-800/40 text-xs text-slate-300 shadow">
              <div className="font-bold text-amber-400">{user?.first_name}'s Account</div>
              <div className="text-emerald-400 text-[11px]">Primary Member</div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 bg-[#050813] overflow-y-auto mb-16 md:mb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Quick Bar (< md) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex justify-around items-center px-2 py-2 md:hidden shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                active ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">{item.label.split(' ')[1] || item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
