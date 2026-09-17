import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CreditCard, CheckCircle2, Clock, Plus, AlertCircle, Sparkles, Send, Landmark } from 'lucide-react';

export const FarmerLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [loanFormData, setLoanFormData] = useState({
    loan_product_id: '',
    requested_amount: '',
    purpose: '',
  });

  useEffect(() => {
    fetchFarmerLoans();
  }, []);

  const fetchFarmerLoans = async () => {
    setLoading(true);
    try {
      const [lRes, aRes, pRes] = await Promise.all([
        api.get('/loans/accounts/'),
        api.get('/loans/applications/'),
        api.get('/loans/products/'),
      ]);
      const lList = Array.isArray(lRes.data) ? lRes.data : (lRes.data.results || []);
      const aList = Array.isArray(aRes.data) ? aRes.data : (aRes.data.results || []);
      const pList = Array.isArray(pRes.data) ? pRes.data : (pRes.data.results || []);

      setLoans(lList);
      setApplications(aList);
      setProducts(pList);

      if (pList.length > 0) {
        setLoanFormData(prev => ({ ...prev, loan_product_id: pList[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSubmitting(true);

    try {
      await api.post('/loans/applications/', {
        loan_product: loanFormData.loan_product_id,
        requested_amount: loanFormData.requested_amount,
        purpose: loanFormData.purpose,
      });

      setMsg({ type: 'success', text: 'Agricultural Loan Application submitted successfully! PKPS Loan Officer will review it.' });
      setShowApplyModal(false);
      setLoanFormData(prev => ({ ...prev, requested_amount: '', purpose: '' }));
      fetchFarmerLoans();
    } catch (err: any) {
      console.error(err);
      setMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to submit loan application. Ensure your member profile is verified.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/30 shadow-2xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
            Agricultural Credit Services
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-2">
            My Crop Loans & Application Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Self-service loan application, lifecycle status tracking, and active repayment statements
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Apply for Loan</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border border-red-500/30 text-red-300'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {/* Loan Applications Lifecycle Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <span>Submitted Loan Applications</span>
        </h2>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading loan applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <Landmark className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold text-sm">No loan applications submitted yet</p>
            <p className="text-slate-500 text-xs">Click "Apply for Loan" to request a crop or agricultural loan from your society.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <span className="font-mono text-xs text-emerald-400 font-bold">{app.application_number}</span>
                    <h3 className="font-semibold text-slate-100 text-base">{app.product_name || 'Crop Loan'}</h3>
                    <p className="text-xs text-slate-400">Purpose: {app.purpose}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-2xl font-bold text-emerald-400">₹{app.requested_amount}</span>
                    <p className="text-xs text-slate-500">Applied: {new Date(app.applied_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Status Badge & Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-800/80 text-center text-xs">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-center space-x-1 font-semibold ${
                    ['SUBMITTED', 'UNDER_VERIFICATION', 'UNDER_ASSESSMENT', 'PENDING_APPROVAL', 'APPROVED', 'SANCTIONED', 'DISBURSED'].includes(app.status)
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submitted</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center justify-center space-x-1 font-semibold ${
                    ['UNDER_VERIFICATION', 'UNDER_ASSESSMENT', 'PENDING_APPROVAL', 'APPROVED', 'SANCTIONED', 'DISBURSED'].includes(app.status)
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center justify-center space-x-1 font-semibold ${
                    ['APPROVED', 'SANCTIONED', 'DISBURSED'].includes(app.status)
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approved</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center justify-center space-x-1 font-semibold ${
                    app.status === 'DISBURSED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Disbursed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Loans & Repayment Statements */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-blue-400" />
          <span>Active Loan Accounts</span>
        </h2>

        {loans.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No active loan accounts currently disbursed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800">
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
                  <tr key={loan.id} className="hover:bg-slate-800/50 transition">
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
        )}
      </div>

      {/* Apply Loan Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">New Loan Request</span>
                <h3 className="text-xl font-bold text-slate-100">Apply for Agricultural Loan</h3>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-100 text-lg">✕</button>
            </div>

            <form onSubmit={handleApplyLoan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Select Loan Product *
                </label>
                <select
                  required
                  value={loanFormData.loan_product_id}
                  onChange={(e) => setLoanFormData({ ...loanFormData, loan_product_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.interest_rate_pa}% p.a.) - Max ₹{p.max_amount}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Requested Loan Amount (₹) *
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  placeholder="e.g. 50000"
                  value={loanFormData.requested_amount}
                  onChange={(e) => setLoanFormData({ ...loanFormData, requested_amount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-bold text-lg text-emerald-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Loan Purpose & Crop Details *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Purchase of seeds, fertilizers & crop maintenance for Kharif Paddy season"
                  value={loanFormData.purpose}
                  onChange={(e) => setLoanFormData({ ...loanFormData, purpose: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting Request...' : 'Submit Loan Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
