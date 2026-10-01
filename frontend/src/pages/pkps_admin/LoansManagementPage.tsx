import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CreditCard, DollarSign, Plus, Package, X, Send } from 'lucide-react';

export const LoansManagementPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [repayModal, setRepayModal] = useState<any>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productMsg, setProductMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [productForm, setProductForm] = useState({
    code: '',
    name: '',
    interest_rate_pa: '',
    min_amount: '',
    max_amount: '',
    tenure_months: '12',
    description: '',
  });

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
      setApplications(Array.isArray(appRes.data) ? appRes.data : (appRes.data.results || []));
      setAccounts(Array.isArray(accRes.data) ? accRes.data : (accRes.data.results || []));
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.results || []));
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.post(`/loans/applications/${id}/verify/`);
      fetchLoansData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Verification failed');
    }
  };

  const handleApprove = async (id: string, amount: string) => {
    try {
      await api.post(`/loans/applications/${id}/approve/`, { approved_amount: amount });
      fetchLoansData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Approval failed');
    }
  };

  const handleDisburse = async (id: string) => {
    try {
      await api.post(`/loans/applications/${id}/disburse/`);
      fetchLoansData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Disbursement failed');
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
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Repayment processing failed');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductMsg(null);
    setProductSubmitting(true);
    try {
      await api.post('/loans/products/', {
        code: productForm.code.trim().toUpperCase(),
        name: productForm.name.trim(),
        interest_rate_pa: productForm.interest_rate_pa,
        min_amount: productForm.min_amount,
        max_amount: productForm.max_amount,
        tenure_months: productForm.tenure_months,
        description: productForm.description.trim(),
      });
      setProductMsg({ type: 'success', text: 'Loan product created successfully.' });
      setProductForm({ code: '', name: '', interest_rate_pa: '', min_amount: '', max_amount: '', tenure_months: '12', description: '' });
      fetchLoansData();
      setTimeout(() => setShowProductModal(false), 1200);
    } catch (err: any) {
      const detail = err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create loan product.';
      setProductMsg({ type: 'error', text: detail });
    } finally {
      setProductSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    SUBMITTED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    UNDER_VERIFICATION: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    UNDER_ASSESSMENT: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    PENDING_APPROVAL: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    DISBURSED: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/30',
    CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Agricultural Loans & Recovery</h1>
          <p className="text-slate-400 text-sm">Maker-Checker Approval Workflow, Disbursements & Repayments</p>
        </div>
        <button
          onClick={() => { setShowProductModal(true); setProductMsg(null); }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Loan Scheme</span>
        </button>
      </div>

      {/* Loan Products Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
          <Package className="w-4 h-4 text-teal-400" />
          <span>Configured Loan Schemes ({products.length})</span>
        </h2>
        {products.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm space-y-2">
            <Package className="w-7 h-7 mx-auto text-slate-700" />
            <p>No loan products configured yet. Click "New Loan Scheme" to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-teal-400 font-bold">{p.code}</span>
                    <p className="text-sm font-semibold text-slate-100 leading-tight mt-0.5">{p.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.is_active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700/40 text-slate-400 border border-slate-700'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div className="text-slate-400">Rate: <span className="text-emerald-400 font-semibold">{p.interest_rate_pa}% p.a.</span></div>
                  <div className="text-slate-400">Tenure: <span className="text-slate-200 font-semibold">{p.tenure_months} mo</span></div>
                  <div className="text-slate-400">Min: <span className="text-slate-200">&#8377;{Number(p.min_amount).toLocaleString('en-IN')}</span></div>
                  <div className="text-slate-400">Max: <span className="text-slate-200 font-semibold">&#8377;{Number(p.max_amount).toLocaleString('en-IN')}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Applications Workflow Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <span>Loan Applications — Maker-Checker Approvals</span>
        </h2>

        {applications.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm">No loan applications submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800">
                <tr>
                  <th className="p-4">App No</th>
                  <th className="p-4">Farmer</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Requested</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-4 font-mono text-xs text-emerald-400 font-semibold">{app.application_number}</td>
                    <td className="p-4 font-semibold text-slate-100">
                      {app.member_name}
                      <span className="block text-[11px] text-slate-500 font-normal">{app.member_number}</span>
                    </td>
                    <td className="p-4 text-slate-300">{app.product_name}</td>
                    <td className="p-4 font-bold text-slate-200">&#8377;{Number(app.requested_amount).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[app.status] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {app.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleVerify(app.id)}
                          className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-medium transition"
                        >
                          1. Verify
                        </button>
                      )}
                      {['UNDER_VERIFICATION', 'UNDER_ASSESSMENT', 'PENDING_APPROVAL'].includes(app.status) && (
                        <button
                          onClick={() => handleApprove(app.id, app.requested_amount)}
                          className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-medium transition"
                        >
                          2. Approve
                        </button>
                      )}
                      {app.status === 'APPROVED' && (
                        <button
                          onClick={() => handleDisburse(app.id)}
                          className="px-3 py-1 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-medium transition"
                        >
                          3. Disburse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Loan Accounts & Repayments */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-blue-400" />
          <span>Active Loan Accounts & Repayments</span>
        </h2>

        {accounts.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm">No disbursed loan accounts yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800">
                <tr>
                  <th className="p-4">Loan Acc No</th>
                  <th className="p-4">Farmer</th>
                  <th className="p-4">Disbursed</th>
                  <th className="p-4">Outstanding Bal</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Repayment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-4 font-mono text-xs text-blue-400 font-semibold">{acc.account_number}</td>
                    <td className="p-4 font-semibold text-slate-100">
                      {acc.member_name}
                      <span className="block text-[11px] text-slate-500 font-normal">{acc.member_number}</span>
                    </td>
                    <td className="p-4 text-slate-400">&#8377;{Number(acc.disbursed_amount).toLocaleString('en-IN')}</td>
                    <td className="p-4 font-bold text-emerald-400">&#8377;{Number(acc.outstanding_principal).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[acc.loan_status] || 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                        {acc.loan_status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {acc.loan_status !== 'CLOSED' && (
                        <button
                          onClick={() => setRepayModal(acc)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
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
        )}
      </div>

      {/* Repayment Modal */}
      {repayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100">Record Loan Repayment</h3>
              <button onClick={() => setRepayModal(null)} className="text-slate-400 hover:text-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-400 font-mono">Account: {repayModal.account_number} — {repayModal.member_name}</p>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Outstanding Principal:</span>
                <span className="text-emerald-400 font-bold">&#8377;{Number(repayModal.outstanding_principal).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <form onSubmit={handleProcessRepayment} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1 font-semibold">Repayment Amount (&#8377;)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 10000"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-lg font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setRepayModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition">
                  Post Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Loan Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Loan Configuration</span>
                <h3 className="text-xl font-bold text-slate-100">Create New Loan Scheme</h3>
              </div>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-100"><X className="w-5 h-5" /></button>
            </div>

            {productMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium ${productMsg.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border border-red-500/30 text-red-300'}`}>
                {productMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Scheme Code *</label>
                  <input
                    required
                    placeholder="e.g. KCC-CROP-01"
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm font-mono focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Interest Rate (% p.a.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    placeholder="e.g. 7.50"
                    value={productForm.interest_rate_pa}
                    onChange={(e) => setProductForm({ ...productForm, interest_rate_pa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Scheme / Product Name *</label>
                <input
                  required
                  placeholder="e.g. Short-Term Crop Loan (KCC)"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Min Amount (&#8377;) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="5000"
                    value={productForm.min_amount}
                    onChange={(e) => setProductForm({ ...productForm, min_amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Max Amount (&#8377;) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="300000"
                    value={productForm.max_amount}
                    onChange={(e) => setProductForm({ ...productForm, max_amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Tenure (Months) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="12"
                    value={productForm.tenure_months}
                    onChange={(e) => setProductForm({ ...productForm, tenure_months: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description / Scheme Notes</label>
                <textarea
                  rows={2}
                  placeholder="Brief description about this loan product and its eligible purposes..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Cancel</button>
                <button
                  type="submit"
                  disabled={productSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{productSubmitting ? 'Creating...' : 'Create Loan Scheme'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};