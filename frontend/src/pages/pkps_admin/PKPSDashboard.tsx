import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, CreditCard, Landmark, PiggyBank, AlertCircle, Clock } from 'lucide-react';

export const PKPSDashboard: React.FC = () => {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{metrics?.pkps_name || 'Society Overview'}</h1>
        <p className="text-emerald-400 text-sm font-mono">Society Code: {metrics?.pkps_code}</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Society Members</span>
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 mt-4">{metrics?.total_members || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Loan Outstanding</span>
            <CreditCard className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mt-4">₹{metrics?.loan_outstanding || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Savings & Term Deposits</span>
            <PiggyBank className="w-6 h-6 text-teal-400" />
          </div>
          <div className="text-3xl font-bold text-teal-400 mt-4">₹{metrics?.total_savings_deposits || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Share Capital</span>
            <Landmark className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400 mt-4">₹{metrics?.total_share_capital || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-slate-100">Overdue Recovery Summary</h2>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Overdue Amount</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">₹{metrics?.overdue_amount || 0}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-slate-100">Pending Workflow Applications</h2>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pending Loan Applications</div>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{metrics?.pending_loan_applications || 0} Applications</div>
          </div>
        </div>
      </div>
    </div>
  );
};
