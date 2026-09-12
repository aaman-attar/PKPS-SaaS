import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { UserCheck, CreditCard, Landmark, PiggyBank, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FarmerDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/reports/dashboard/');
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-emerald-700/50 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
            Active Member Profile
          </span>
          <h1 className="text-3xl font-bold text-slate-100">
            Namaste, {metrics?.member_name || 'Ramesh Patil'}!
          </h1>
          <p className="text-emerald-200 text-sm">
            Member ID: <span className="font-mono font-bold text-white">{metrics?.member_number || 'M-000125'}</span>
          </p>
        </div>
      </div>

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
  );
};
