import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Smartphone, Mail, ArrowRight, Wheat, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register/', formData);
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      await refreshUser();
      navigate('/farmer/dashboard');
    } catch (err: any) {
      if (err.response?.data) {
        const d = err.response.data;
        const msg = Object.keys(d).map(k => `${k}: ${Array.isArray(d[k]) ? d[k].join(', ') : d[k]}`).join(' | ');
        setError(msg || 'Registration failed. Please check form data.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050813] text-slate-100 flex flex-col justify-between items-center p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      
      {/* Background Glowing Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* Header */}
      <header className="w-full max-w-md md:max-w-2xl flex items-center justify-between py-2 relative z-10">
        <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-emerald-400 font-medium shadow-md">
          <Wheat className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>PKPS Farmer Portal Registration</span>
        </div>
        <Link to="/login" className="text-xs text-slate-400 hover:text-emerald-400 flex items-center space-x-1 font-medium transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>
      </header>

      {/* Main Glass Card */}
      <main className="w-full max-w-lg glass-card border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-6 transition-all">
        
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
            <UserCheck className="w-7 h-7 text-slate-950 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
            Farmer Registration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Create your account to apply for membership in your local Primary Agricultural Cooperative Society (PKPS)
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1 shrink-0 animate-ping"></div>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Ramesh"
                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Patil"
                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Username *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="ramesh_patil"
                  className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  name="mobile"
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Email Address (Optional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ramesh@example.com"
                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Set Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/25 active:scale-[0.99] flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Creating Account...' : 'Register Account & Continue'}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>

        <div className="text-center mt-5 pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-400">Already have an account? </span>
          <Link to="/login" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
            Sign In Here
          </Link>
        </div>
      </main>

      <footer className="w-full max-w-md text-center py-2 text-xs text-slate-500 relative z-10">
        <p>© 2026 PKPS Digital Platform • Multi-Tenant Cooperative Society Management</p>
      </footer>
    </div>
  );
};
