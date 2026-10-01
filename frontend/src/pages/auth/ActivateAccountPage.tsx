import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  Building2, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, 
  AlertCircle, ArrowRight, Sparkles, Check, KeyRound, UserCheck
} from 'lucide-react';

interface InvitationDetails {
  valid: boolean;
  name: string;
  email: string;
  tenant_code: string;
  tenant_name: string;
  expires_at: string;
}

export const ActivateAccountPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    tenant_code: string;
    username: string;
  } | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided. Please check your invitation link or contact your SaaS Administrator.');
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/tenants/invitation/?token=${encodeURIComponent(token)}`);
        setInvitation(res.data);
      } catch (err: any) {
        console.error('Validation error:', err);
        setError(
          err.response?.data?.detail || 
          'This invitation link is invalid or has expired. Please contact your SaaS Administrator to request a new link.'
        );
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!hasMinLength) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/tenants/activate/', {
        token,
        password,
        confirm_password: confirmPassword,
      });

      setSuccessData(res.data);
    } catch (err: any) {
      console.error('Activation error:', err);
      setFormError(err.response?.data?.detail || 'Failed to activate account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050813] text-slate-100 flex flex-col justify-between items-center p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="w-full max-w-6xl flex justify-between items-center py-4 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              PKPS ERP Cloud
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              SaaS Co-Operative Platform
            </p>
          </div>
        </div>

        <Link
          to="/login"
          className="text-xs text-slate-400 hover:text-emerald-400 transition flex items-center space-x-1"
        >
          <span>Already activated?</span>
          <span className="font-semibold text-emerald-400 underline">Login</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-md my-auto z-10 py-6">
        {loading ? (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-12 h-12 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-lg font-bold text-slate-200">Verifying Invitation Link...</h2>
            <p className="text-xs text-slate-400 mt-1">Checking secure credentials and tenant identity</p>
          </div>
        ) : error ? (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Invalid or Expired Invitation</h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{error}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : successData ? (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl shadow-emerald-500/10 space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                Account Active
              </span>
              <h2 className="text-2xl font-extrabold text-white">Setup Completed!</h2>
              <p className="text-sm text-slate-300 mt-1">
                Your PKPS Administrator account has been provisioned and your society ERP environment is live.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Society:</span>
                <span className="font-semibold text-slate-200">{invitation?.tenant_name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Tenant Code:</span>
                <span className="font-mono text-emerald-400 font-semibold">{successData.tenant_code}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Your Username:</span>
                <span className="font-mono text-cyan-400 font-semibold">{successData.username}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/login?username=${encodeURIComponent(successData.username)}`)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
            >
              <span>Launch PKPS ERP Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header info */}
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PKPS Administrator Onboarding</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Activate Your Account</h2>
              <p className="text-xs text-slate-400 mt-1">
                You have been invited to manage your society's cooperative ERP platform.
              </p>
            </div>

            {/* Society Badge Card */}
            {invitation && (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm">{invitation.tenant_name}</h3>
                    <p className="text-slate-400 text-[11px]">Tenant Code: <span className="text-cyan-400 font-mono">{invitation.tenant_code}</span></p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Invited Administrator:</span>
                  <span className="font-medium text-slate-200">{invitation.name} ({invitation.email})</span>
                </div>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Set Your Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter strong password"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition"
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  <span className={hasMinLength ? 'text-slate-200' : ''}>At least 8 characters long</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasNumber ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  <span className={hasNumber ? 'text-slate-200' : ''}>Contains numbers or letters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${passwordsMatch ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  <span className={passwordsMatch ? 'text-slate-200' : ''}>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !hasMinLength || !passwordsMatch}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition"
              >
                {submitting ? (
                  <span>Activating Account...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Complete Activation & Save Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl text-center py-4 text-xs text-slate-500 z-10">
        PKPS SaaS Co-Operative Core Banking Platform &copy; 2026. Ministry of Cooperation PACS Standards.
      </footer>
    </div>
  );
};
