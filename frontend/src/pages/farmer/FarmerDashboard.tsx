import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MembershipApplication } from '../../types';
import { ApplyMembershipPage } from './ApplyMembershipPage';
import { 
  UserCheck, CreditCard, Landmark, PiggyBank, Calendar, ArrowRight, 
  Clock, CheckCircle2, AlertTriangle, FileText, Download, Sparkles, Building2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [appState, setAppState] = useState<{ has_application: boolean; application: MembershipApplication | null }>({
    has_application: false,
    application: null,
  });
  const [loadingApp, setLoadingApp] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);

  useEffect(() => {
    fetchApplicationStatus();
    if (user?.tenant) {
      fetchDashboardMetrics();
    }
  }, [user]);

  const fetchApplicationStatus = async () => {
    try {
      const res = await api.get('/members/applications/my-application/');
      setAppState(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApp(false);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      const res = await api.get('/reports/dashboard/');
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // If farmer chooses to open the application form
  if (showApplyForm) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowApplyForm(false)}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center space-x-1"
        >
          <span>← Back to Dashboard</span>
        </button>
        <ApplyMembershipPage onComplete={() => { setShowApplyForm(false); fetchApplicationStatus(); }} />
      </div>
    );
  }

  const { has_application, application } = appState;
  const isMemberVerified = !!user?.tenant || application?.status === 'APPROVED';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Dynamic Status Header Banner */}
      {isMemberVerified ? (
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-emerald-700/50 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 w-fit">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Society Member</span>
            </span>
            <h1 className="text-3xl font-bold text-slate-100">
              Namaste, {metrics?.member_name || `${user?.first_name} ${user?.last_name}`}!
            </h1>
            <p className="text-emerald-200 text-sm">
              Society: <strong className="text-white">{user?.tenant?.name || 'PKPS Society'}</strong> | Member ID: <span className="font-mono font-bold text-white">{metrics?.member_number || 'ACTIVE-MEMBER'}</span>
            </p>
          </div>
        </div>
      ) : has_application && application?.status === 'PENDING' ? (
        /* PENDING APPLICATION CARD */
        <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 w-fit">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                <span>Membership Application Under Verification</span>
              </span>
              <h2 className="text-2xl font-bold text-slate-100">
                Application Submitted to {application.tenant?.name || 'PKPS Society'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Submitted on: <strong className="text-slate-200">{new Date(application.created_at).toLocaleDateString()}</strong>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block">Applicant Name:</span>
              <strong className="text-slate-100">{application.first_name} {application.last_name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Land Sy. No.:</span>
              <strong className="text-slate-100">{application.land_survey_number} ({application.land_area_acres} Acres)</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Uploaded Document:</span>
              {application.utara_document ? (
                <a
                  href={`http://localhost:8000${application.utara_document}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 font-semibold hover:underline flex items-center space-x-1 mt-0.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>View Utara Document</span>
                </a>
              ) : (
                <span className="text-slate-400">No document attached</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your application and Utara document are currently being inspected by the PKPS Society Administrator. Society facilities (Loans, Savings, Shares) will unlock here automatically as soon as your application is verified & approved.
            </p>
          </div>
        </div>
      ) : has_application && application?.status === 'REJECTED' ? (
        /* REJECTED APPLICATION CARD */
        <div className="p-8 rounded-3xl bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-950 border border-red-500/40 shadow-2xl space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 w-fit">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Application Needs Attention</span>
              </span>
              <h2 className="text-2xl font-bold text-slate-100">
                Membership Application Rejected
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Reason: <strong className="text-red-300">{application.rejection_reason || 'Incomplete details or invalid Utara document.'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowApplyForm(true)}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg transition"
          >
            Re-submit Application with Corrected Utara Document
          </button>
        </div>
      ) : (
        /* NO APPLICATION SUBMITTED CARD */
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/30 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-slate-100">Apply for PKPS Society Membership</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Welcome! To access society facilities such as agricultural loans, thrift deposits, and share dividends, please submit your membership application and upload your **Utara document**.
            </p>
          </div>
          <button
            onClick={() => setShowApplyForm(true)}
            className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/25 transition cursor-pointer"
          >
            Fill Application & Upload Utara Document
          </button>
        </div>
      )}

      {/* Facilities Cards (Unlocked for Verified Members) */}
      <div className={`space-y-8 ${!isMemberVerified ? 'opacity-40 pointer-events-none filter blur-[1px]' : ''}`}>
        
        {!isMemberVerified && (
          <div className="text-center py-2 text-xs font-semibold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 rounded-xl">
            🔒 Society Facilities locked until application verification by PKPS Admin
          </div>
        )}

        {/* Main Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Shares Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Share Capital</span>
              <Landmark className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400 mt-4">
              ₹{metrics?.shares_amount || '5,000'}
            </div>
            <p className="text-xs text-slate-500 mt-2">50 Shares @ ₹100/unit</p>
          </div>

          {/* Savings Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Thrift Savings</span>
              <PiggyBank className="w-6 h-6 text-teal-400" />
            </div>
            <div className="text-3xl font-bold text-teal-400 mt-4">
              ₹{metrics?.savings_balance || '12,500'}
            </div>
            <p className="text-xs text-slate-500 mt-2">Annual Yield @ 4.00% p.a.</p>
          </div>

          {/* Loan Outstanding Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Loan Outstanding</span>
              <CreditCard className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400 mt-4">
              ₹{metrics?.loan_outstanding || '42,000'}
            </div>
            <div className="flex items-center space-x-2 text-xs text-amber-400 mt-2">
              <Calendar className="w-4 h-4" />
              <span>Next Due Date: 15 Oct 2026</span>
            </div>
          </div>
        </div>

        {/* Quick Self-Service Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/farmer/loans"
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between group transition"
          >
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-100 group-hover:text-emerald-400 transition">Track Loan Applications</h3>
              <p className="text-xs text-slate-400">View loan approval progress and repayment history</p>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/farmer/savings"
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 flex items-center justify-between group transition"
          >
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-100 group-hover:text-teal-400 transition">Savings & Share Statements</h3>
              <p className="text-xs text-slate-400">Inspect thrift balance and share dividend records</p>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
};
