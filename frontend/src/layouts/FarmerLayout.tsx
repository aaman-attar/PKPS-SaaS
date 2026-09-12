import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, CreditCard, PiggyBank, Home, LogOut } from 'lucide-react';

export const FarmerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Mobile-Friendly Navbar */}
      <header className="bg-emerald-950 border-b border-emerald-800/50 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/30">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-emerald-300">
              Farmer Self-Service Portal
            </h1>
            <p className="text-xs text-emerald-400/80">{user?.tenant?.name || 'PKPS Society'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold text-slate-200">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-emerald-400">Verified Member</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-emerald-900/50 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-800 transition"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Bar */}
        <aside className="bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 w-full md:w-64 p-4">
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium whitespace-nowrap transition ${
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
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 bg-slate-950 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
