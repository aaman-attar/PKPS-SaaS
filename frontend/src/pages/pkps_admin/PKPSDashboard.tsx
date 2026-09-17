import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, CreditCard, Landmark, PiggyBank, AlertCircle, Clock, ClipboardCheck, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PKPSDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard/');
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/20 shadow-2xl gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PACS Real-Time Management Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">{metrics?.pkps_name || 'Society Management Portal'}</h1>
          <p className="text-emerald-400 text-xs sm:text-sm font-mono mt-0.5">Society Registration Code: {metrics?.pkps_code}</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/30 transition shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Active Members</span>
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 mt-4">{metrics?.total_members || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Verified PACS Farmers</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-blue-500/30 transition shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Loan Outstanding</span>
            <CreditCard className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mt-4">₹{metrics?.loan_outstanding || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Disbursed Crop Loans</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-teal-500/30 transition shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Savings Deposits</span>
            <PiggyBank className="w-6 h-6 text-teal-400" />
          </div>
          <div className="text-3xl font-bold text-teal-400 mt-4">₹{metrics?.total_savings_deposits || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Thrift & SB Balances</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-purple-500/30 transition shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Share Capital</span>
            <Landmark className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400 mt-4">₹{metrics?.total_share_capital || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Member Share Capital</p>
        </div>
      </div>

      {/* Action & Verification Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pending Membership Applications Card */}
        <Link
          to="/pkps/applications"
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/50 transition group shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Membership Desk</span>
              <ClipboardCheck className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition">
              Pending Farmer Membership Applications
            </h2>
            <div className="text-3xl font-bold text-amber-400 mt-3">
              {metrics?.pending_membership_applications || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Farmer accounts awaiting Utara document verification
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-bold text-emerald-400 mt-4 group-hover:translate-x-1 transition">
            <span>Review Applications</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Pending Loan Applications Card */}
        <Link
          to="/pkps/loans"
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/50 transition group shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Loan Approval Desk</span>
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition">
              Pending Crop Loan Applications
            </h2>
            <div className="text-3xl font-bold text-cyan-400 mt-3">
              {metrics?.pending_loan_applications || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Submitted loan requests awaiting Maker-Checker approval
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-bold text-cyan-400 mt-4 group-hover:translate-x-1 transition">
            <span>Review Loans Desk</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Overdue Recovery Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">Recovery Status</span>
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Overdue Recovery Balance
            </h2>
            <div className="text-3xl font-bold text-red-400 mt-3">
              ₹{metrics?.overdue_amount || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Overdue loan principal & interest total
            </p>
          </div>
          <Link
            to="/pkps/loans"
            className="flex items-center space-x-1 text-xs font-bold text-slate-300 hover:text-white mt-4 transition"
          >
            <span>Collect Repayments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
};
