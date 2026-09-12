import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CreditCard, CheckCircle2, ShieldCheck, DollarSign, ArrowUpRight } from 'lucide-react';

export const LoansManagementPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [repayModal, setRepayModal] = useState<any>(null);
  const [repayAmount, setRepayAmount] = useState('');

  useEffect(() => {
    fetchLoansData();
  }, []);

  const fetchLoansData = async () => {
    try {
      const [appRes, accRes, prodRes] = await Promise.all([
        api.get('/loans/applications/'),
        api.get('/loans/accounts/'),
        api.get('/loans/products/'),
      ]);
      setApplications(appRes.data.results || appRes.data);
      setAccounts(accRes.data.results || accRes.data);
      setProducts(prodRes.data.results || prodRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.post(`/loans/applications/${id}/verify/`);
      fetchLoansData();
    } catch (err) {
      alert('Verification failed');
    }
  };

  const handleApprove = async (id: string, amount: string) => {
    try {
      await api.post(`/loans/applications/${id}/approve/`, { approved_amount: amount });
      fetchLoansData();
    } catch (err) {
      alert('Approval failed');
    }
  };

  const handleDisburse = async (id: string) => {
    try {
      await api.post(`/loans/applications/${id}/disburse/`);
      fetchLoansData();
    } catch (err) {
      alert('Disbursement failed');
    }
  };

  const handleProcessRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayModal) return;
    try {
      await api.post(`/loans/accounts/${repayModal.id}/repay/`, {
        amount: repayAmount,
        payment_mode: 'CASH',
      });
      setRepayModal(null);
      setRepayAmount('');
      fetchLoansData();
    } catch (err) {
      alert('Repayment processing failed');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Agricultural Loans & Recovery</h1>
        <p className="text-slate-400 text-sm">Maker-Checker Approval Workflow, Disbursements & Repayments</p>
      </div>

      {/* Applications Workflow Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <span>Loan Applications & Maker-Checker Approvals</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">App No</th>
                <th className="p-4">Farmer</th>
                <th className="p-4">Product</th>
                <th className="p-4">Requested</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Maker-Checker Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-mono text-xs text-emerald-400">{app.application_number}</td>
                  <td className="p-4 font-semibold text-slate-100">{app.member_name} ({app.member_number})</td>
                  <td className="p-4">{app.product_name}</td>
                  <td className="p-4 font-bold text-slate-200">₹{app.requested_amount}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {app.status === 'SUBMITTED' && (
                      <button
                        onClick={() => handleVerify(app.id)}
                        className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-medium"
                      >
                        1. Verify App
                      </button>
                    )}
                    {['UNDER_VERIFICATION', 'UNDER_ASSESSMENT', 'PENDING_APPROVAL'].includes(app.status) && (
                      <button
                        onClick={() => handleApprove(app.id, app.requested_amount)}
                        className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-medium"
                      >
                        2. Approve Loan
                      </button>
                    )}
                    {app.status === 'APPROVED' && (
                      <button
                        onClick={() => handleDisburse(app.id)}
                        className="px-3 py-1 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-medium"
                      >
                        3. Disburse Loan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disbursed Active Loan Accounts Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-blue-400" />
          <span>Active Loan Accounts & Repayments</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">Loan Acc No</th>
                <th className="p-4">Farmer</th>
                <th className="p-4">Disbursed</th>
                <th className="p-4">Outstanding Bal</th>
                <th className="p-4">Loan Status</th>
                <th className="p-4 text-right">Repayment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-mono text-xs text-blue-400 font-semibold">{acc.account_number}</td>
                  <td className="p-4 font-semibold text-slate-100">{acc.member_name} ({acc.member_number})</td>
                  <td className="p-4 text-slate-400">₹{acc.disbursed_amount}</td>
                  <td className="p-4 font-bold text-emerald-400">₹{acc.outstanding_principal}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {acc.loan_status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {acc.loan_status !== 'CLOSED' && (
                      <button
                        onClick={() => setRepayModal(acc)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-600/20"
                      >
                        Collect Repayment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repayment Modal */}
      {repayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Record Loan Repayment</h3>
            <p className="text-xs text-slate-400 font-mono">Account: {repayModal.account_number} ({repayModal.member_name})</p>

            <form onSubmit={handleProcessRepayment} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Repayment Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 10000"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-lg font-bold text-emerald-400"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRepayModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm"
                >
                  Post Repayment & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
