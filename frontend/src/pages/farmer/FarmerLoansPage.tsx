import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CreditCard, CheckCircle2, Clock, FileText } from 'lucide-react';

export const FarmerLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    fetchFarmerLoans();
  }, []);

  const fetchFarmerLoans = async () => {
    try {
      const [lRes, aRes] = await Promise.all([
        api.get('/loans/accounts/'),
        api.get('/loans/applications/'),
      ]);
      setLoans(lRes.data.results || lRes.data);
      setApplications(aRes.data.results || aRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const stages = [
    { label: 'Submitted', key: 'SUBMITTED' },
    { label: 'Under Verification', key: 'UNDER_VERIFICATION' },
    { label: 'Under Approval', key: 'APPROVED' },
    { label: 'Disbursed', key: 'DISBURSED' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Loans & Application Tracker</h1>
        <p className="text-slate-400 text-sm">Self-service view of your active crop loans and application statuses</p>
      </div>

      {/* Application Status Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <span>Application Lifecycle Tracker</span>
        </h2>

        {applications.map((app) => (
          <div key={app.id} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-mono text-xs text-emerald-400 font-bold">{app.application_number}</span>
                <h3 className="font-semibold text-slate-100">{app.product_name}</h3>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-slate-100">₹{app.requested_amount}</span>
                <p className="text-xs text-slate-400">{app.purpose}</p>
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-800 text-center">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Submitted</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Approved</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Disbursed</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Loans & Repayment Statements */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-blue-400" />
          <span>Active Loan Accounts</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">Loan Account</th>
                <th className="p-4">Sanctioned</th>
                <th className="p-4">Outstanding Bal</th>
                <th className="p-4">Interest Rate</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-mono text-xs text-blue-400 font-semibold">{loan.account_number}</td>
                  <td className="p-4 text-slate-300">₹{loan.sanctioned_amount}</td>
                  <td className="p-4 font-bold text-emerald-400">₹{loan.outstanding_principal}</td>
                  <td className="p-4 text-slate-400">{loan.interest_rate_pa}% p.a.</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {loan.loan_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
