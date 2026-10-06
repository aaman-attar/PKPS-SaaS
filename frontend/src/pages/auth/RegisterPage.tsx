import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Lock, Smartphone, Mail, ArrowRight, Wheat, ArrowLeft, 
  ShieldCheck, UserCheck, RefreshCw, KeyRound, CheckCircle2, Sparkles
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { requestOTP, registerFarmer } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
  });

  // Step 1: Form details, Step 2: OTP verification
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpMsg, setOtpMsg] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Validate input & request registration OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanMobile = formData.mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!formData.username.trim()) {
      setError('Please choose a username.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestOTP(cleanMobile, 'REGISTRATION', formData.username.trim());
      setIsOtpStep(true);
      setOtpMsg(res.message);
      setDevOtp(res.dev_otp ?? null);
      setCountdown(60);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.join(' ') : (detail || 'Could not send verification OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit registration with OTP code
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP verification code.');
      return;
    }

    setLoading(true);
    try {
      await registerFarmer({
        ...formData,
        mobile: formData.mobile.replace(/[^0-9]/g, ''),
        otp_code: otpCode.trim()
      });
      navigate('/farmer/dashboard');
    } catch (err: any) {
      if (err.response?.data) {
        const d = err.response.data;
        const msg = Object.keys(d).map(k => `${k}: ${Array.isArray(d[k]) ? d[k].join(', ') : d[k]}`).join(' | ');
        setError(msg || 'Registration failed. Please check your OTP code and details.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResending(true);
    try {
      const cleanMobile = formData.mobile.replace(/[^0-9]/g, '');
      const res = await requestOTP(cleanMobile, 'REGISTRATION');
      setOtpMsg(res.message);
      setDevOtp(res.dev_otp ?? null);
      setCountdown(60);
    } catch (err: any) {
      setError('Could not resend OTP. Please wait before requesting again.');
    } finally {
      setResending(false);
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/25">
            {isOtpStep ? (
              <ShieldCheck className="w-8 h-8 text-slate-950 stroke-[2.2]" />
            ) : (
              <UserCheck className="w-8 h-8 text-slate-950 stroke-[2.2]" />
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
            {isOtpStep ? 'Verify Mobile Number' : 'Farmer Registration'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {isOtpStep 
              ? `Enter the 6-digit OTP code sent to +91 ${formData.mobile.replace(/[^0-9]/g, '')}`
              : 'Create your account to apply for membership in your local Primary Agricultural Cooperative Society (PKPS)'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-2">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0 animate-ping"></div>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: FARMER REGISTRATION DETAILS (Exact Image 2 layout) */}
        {/* ========================================================= */}
        {!isOtpStep ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  FIRST NAME *
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Ramesh"
                  className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  LAST NAME *
                </label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Patil"
                  className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  USERNAME *
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-emerald-500 absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="ramesh_patil"
                    className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  MOBILE NUMBER *
                </label>
                <div className="relative">
                  <Smartphone className="w-5 h-5 text-emerald-500 absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    name="mobile"
                    required
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="9876543210"
                    className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                EMAIL ADDRESS (OPTIONAL)
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-emerald-500 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ramesh@example.com"
                  className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                SET PASSWORD *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-emerald-500 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/25 active:scale-[0.99] flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Sending Verification OTP...' : 'Register Account & Continue'}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>
        ) : (
          /* ========================================================= */
          /* STEP 2: VERIFY REGISTRATION OTP CODE                     */
          /* ========================================================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {otpMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-medium flex items-start space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{otpMsg}</div>
              </div>
            )}

            {/* Dev Mode OTP Banner (simulation mode) */}
            {devOtp && (
              <div className="rounded-2xl border-2 border-amber-400/60 bg-amber-500/10 p-4 text-center space-y-1.5 shadow-lg shadow-amber-500/10">
                <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
                  <KeyRound className="w-4 h-4" />
                  <span>Dev Mode — OTP Code</span>
                </div>
                <div
                  className="text-4xl font-extrabold tracking-[0.35em] text-amber-300 font-mono cursor-pointer select-all hover:scale-105 transition transform"
                  title="Click to auto-fill OTP"
                  onClick={() => setOtpCode(devOtp)}
                >
                  {devOtp}
                </div>
                <p className="text-[11px] text-amber-500/80">
                  Click code to auto-fill · FAST2SMS_ENABLED=False
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="reg-otpCode" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Enter 6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending || countdown > 0}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resending ? 'Sending...' : (countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP')}
                  </span>
                </button>
              </div>

              <div className="relative">
                <Smartphone className="w-5 h-5 text-cyan-400 absolute left-4 top-3.5 pointer-events-none" />
                <input
                  id="reg-otpCode"
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
                OTP sent to <strong className="text-slate-200">+91 {formData.mobile}</strong> · Valid for 5 minutes
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsOtpStep(false); setError(''); }}
                className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/25 active:scale-[0.99] flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Verifying OTP...' : 'Verify OTP & Complete Registration'}</span>
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-6 pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-400">Already have an account? </span>
          <Link to="/login" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
            Sign In Here
          </Link>
        </div>
      </main>

      <footer className="w-full max-w-md text-center py-2 text-xs text-slate-500 relative z-10">
        <p>© 2026 PKPS / PACS Multi-Tenant SaaS Platform • Secured with End-to-End 2FA</p>
      </footer>
    </div>
  );
};
