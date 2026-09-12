import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, User as UserIcon, KeyRound, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [mfaMsg, setMfaMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res.mfa_required) {
        setIsOtpStep(true);
        setMfaMsg(res.message);
      } else {
        redirectBasedOnRole(res.user.role);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await verifyOTP(username, otpCode);
      redirectBasedOnRole(res.user.role);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const redirectBasedOnRole = (role: string) => {
    if (['SUPER_ADMIN', 'SUPPORT_ADMIN'].includes(role)) {
      navigate('/admin/dashboard');
    } else if (role === 'FARMER') {
      navigate('/farmer/dashboard');
    } else {
      navigate('/pkps/dashboard');
    }
  };

  const quickLoginAs = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setIsOtpStep(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
            <Building2 className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">PKPS / PACS Portal</h2>
          <p className="text-sm text-slate-400 mt-1">Multi-Tenant Agricultural SaaS System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!isOtpStep ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{mfaMsg}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">2-Factor OTP Code</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-100 font-mono tracking-widest text-center text-lg focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Verify OTP & Log In'}</span>
              <ShieldCheck className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* Demo Quick Logins */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500 mb-3">Quick Demo Login Shortcuts:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => quickLoginAs('admin', 'Admin@123')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 font-medium"
            >
              SaaS Admin
            </button>
            <button
              onClick={() => quickLoginAs('pkps_admin', 'PkpsAdmin@123')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-medium"
            >
              PKPS Admin
            </button>
            <button
              onClick={() => quickLoginAs('farmer_ramesh', 'Farmer@123')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-medium"
            >
              Farmer Ramesh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
