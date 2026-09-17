import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, Lock, User as UserIcon, KeyRound, ArrowRight, 
  Building2, CheckCircle2, RefreshCw, Smartphone, Wheat, Sparkles, ArrowLeft
} from 'lucide-react';

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
  const [resending, setResending] = useState(false);

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
      setError(err.response?.data?.detail || 'Invalid OTP verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResending(true);
    try {
      const res = await login(username, password);
      if (res.message) {
        setMfaMsg(res.message);
      }
    } catch (err: any) {
      setError('Could not resend OTP. Please check credentials.');
    } finally {
      setResending(false);
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
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#050813] text-slate-100 flex flex-col justify-between items-center p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      
      {/* Background Animated Gradient Glowing Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-10 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Header Badge */}
      <header className="w-full max-w-md md:max-w-2xl flex items-center justify-between py-2 relative z-10">
        <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-emerald-400 font-medium shadow-md">
          <Wheat className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>PKPS / PACS Agricultural SaaS Portal</span>
        </div>
        <div className="hidden sm:flex items-center space-x-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs text-amber-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fast2SMS OTP Verification</span>
        </div>
      </header>

      {/* Main Glassmorphic Card Container */}
      <main className="w-full max-w-md glass-card border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-auto transition-all duration-300">
        
        {/* Portal Title & Logo */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 transform hover:scale-105 transition duration-300">
              <Building2 className="w-9 h-9 text-slate-950 stroke-[2.2]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-[10px] ring-2 ring-slate-950 shadow">
              ✓
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
            {isOtpStep ? 'Security Verification' : 'Welcome Back'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isOtpStep ? 'Enter the 6-digit OTP code sent to your registered mobile' : 'Sign in to access your Cooperative Society portal'}
          </p>
        </div>

        {/* Dynamic Error Box */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-2">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0 animate-ping"></div>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Step 1: Login Form */}
        {!isOtpStep ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Username / Mobile Number
              </label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-emerald-500 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (e.g. admin)"
                  className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-emerald-500 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/25 active:scale-[0.99] flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating User...' : 'Proceed to Sign In'}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="text-center pt-3 border-t border-slate-800/60">
              <span className="text-xs text-slate-400">Are you a new farmer? </span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition"
              >
                Register Account & Apply to Society
              </button>
            </div>
          </form>

        ) : (
          /* Step 2: OTP Verification Form */
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            
            {/* MFA Notification Banner */}
            {mfaMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-medium flex items-start space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{mfaMsg}</div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-otpCode" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Enter 6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>{resending ? 'Sending...' : 'Resend SMS OTP'}</span>
                </button>
              </div>

              <div className="relative">
                <Smartphone className="w-5 h-5 text-cyan-400 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  id="login-otpCode"
                  name="otpCode"
                  type="text"
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full bg-slate-950 border-2 border-cyan-500/50 rounded-xl pl-12 pr-4 py-3 text-cyan-300 font-mono text-center tracking-[0.4em] text-xl font-bold focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/25 transition-all shadow-inner"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                SMS sent via <strong className="text-slate-200">Fast2SMS Gateway</strong>. Valid for 5 minutes.
              </p>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => { setIsOtpStep(false); setError(''); }}
                className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition flex items-center justify-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-cyan-500/25 active:scale-[0.99] flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Verifying OTP...' : 'Verify OTP & Enter'}</span>
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </form>
        )}

        {/* Demo Roles Shortcut Buttons */}
        <div className="mt-7 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Demo Login:</span>
            <span className="text-[11px] text-emerald-400 font-medium">Click to Auto-fill</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickLoginAs('admin', 'Admin@123')}
              className="p-2.5 rounded-xl bg-gradient-to-b from-blue-950/80 to-slate-900 hover:from-blue-900/90 text-blue-300 border border-blue-500/30 hover:border-blue-400 text-xs font-semibold shadow transition transform hover:-translate-y-0.5 flex flex-col items-center justify-center text-center group"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 mb-1 group-hover:scale-125 transition"></span>
              <span>SaaS Admin</span>
            </button>

            <button
              onClick={() => quickLoginAs('pkps_admin', 'PkpsAdmin@123')}
              className="p-2.5 rounded-xl bg-gradient-to-b from-emerald-950/80 to-slate-900 hover:from-emerald-900/90 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 text-xs font-semibold shadow transition transform hover:-translate-y-0.5 flex flex-col items-center justify-center text-center group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 mb-1 group-hover:scale-125 transition"></span>
              <span>PKPS Admin</span>
            </button>

            <button
              onClick={() => quickLoginAs('farmer_ramesh', 'Farmer@123')}
              className="p-2.5 rounded-xl bg-gradient-to-b from-amber-950/80 to-slate-900 hover:from-amber-900/90 text-amber-300 border border-amber-500/30 hover:border-amber-400 text-xs font-semibold shadow transition transform hover:-translate-y-0.5 flex flex-col items-center justify-center text-center group"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 mb-1 group-hover:scale-125 transition"></span>
              <span>Farmer Ramesh</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-md text-center py-2 text-xs text-slate-500 relative z-10">
        <p>© 2026 PKPS / PACS Multi-Tenant SaaS Platform • Secured with End-to-End 2FA</p>
      </footer>
    </div>
  );
};
