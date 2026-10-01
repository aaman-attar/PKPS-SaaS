import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
  PiggyBank, Plus, ArrowDownRight, ArrowUpRight, Search, 
  Coins, Wallet, CheckCircle2, AlertCircle, X, Clock, 
  Receipt, User, ShieldCheck, Printer, RefreshCw 
} from 'lucide-react';

export const DepositsManagementPage: React.FC = () => {
  const [savings, setSavings] = useState<any[]>([]);
  const [termDeposits, setTermDeposits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'savings' | 'term_deposits' | 'transactions'>('savings');

  // Transact Modal (Savings)
  const [transactModal, setTransactModal] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [tType, setTType] = useState('DEPOSIT');
  const [remarks, setRemarks] = useState('');
  const [transactLoading, setTransactLoading] = useState(false);

  // New Term Deposit Modal (PKPS Staff)
  const [showNewFdModal, setShowNewFdModal] = useState(false);
  const [fdMemberId, setFdMemberId] = useState('');
  const [fdPrincipal, setFdPrincipal] = useState('10000');
  const [fdTenure, setFdTenure] = useState('12');
  const [fdRate, setFdRate] = useState('7.50');
  const [fdLoading, setFdLoading] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchDepositsData();
  }, []);

  const fetchDepositsData = async () => {
    try {
      setLoading(true);
      const [sRes, tdRes, txRes, mRes] = await Promise.all([
        api.get('/deposits/savings/'),
        api.get('/deposits/term/'),
        api.get('/deposits/transactions/'),
        api.get('/members/?status=ACTIVE'),
      ]);
      setSavings(sRes.data.results || sRes.data || []);
      setTermDeposits(tdRes.data.results || tdRes.data || []);
      setTransactions(txRes.data.results || txRes.data || []);
      setMembers(mRes.data.results || mRes.data || []);
    } catch (err) {
      console.error('Failed to fetch deposits data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactModal) return;
    setTransactLoading(true);
    setFeedback(null);
    try {
      const res = await api.post(`/deposits/savings/${transactModal.id}/transact/`, {
        transaction_type: tType,
        amount: amount,
        remarks: remarks || `Counter transaction processed by Society Cashier`,
      });
      setFeedback({
        type: 'success',
        message: `${tType.replace('_', ' ')} of ₹${Number(amount).toLocaleString('en-IN')} posted successfully!`,
      });
      setTransactModal(null);
      setAmount('');
      setRemarks('');
      await fetchDepositsData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Transaction failed.',
      });
    } finally {
      setTransactLoading(false);
    }
  };

  const handleCreateTermDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fdMemberId) {
      setFeedback({ type: 'error', message: 'Please select a member for this Term Deposit.' });
      return;
    }
    setFdLoading(true);
    setFeedback(null);
    try {
      await api.post('/deposits/term/', {
        member_id: fdMemberId,
        principal_amount: fdPrincipal,
        tenure_months: parseInt(fdTenure, 10),
        interest_rate_pa: fdRate,
      });
      setFeedback({
        type: 'success',
        message: `Fixed Deposit Certificate created successfully for member!`,
      });
      setShowNewFdModal(false);
      setFdMemberId('');
      await fetchDepositsData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to issue Term Deposit.',
      });
    } finally {
      setFdLoading(false);
    }
  };

  // Filtered lists
  const filteredSavings = savings.filter((acc) => {
    const term = searchTerm.toLowerCase();
    return (
      (acc.account_number || '').toLowerCase().includes(term) ||
      (acc.member_name || '').toLowerCase().includes(term) ||
      (acc.member_number || '').toLowerCase().includes(term)
    );
  });

  const filteredTermDeposits = termDeposits.filter((td) => {
    const term = searchTerm.toLowerCase();
    return (
      (td.deposit_number || '').toLowerCase().includes(term) ||
      (td.member_name || '').toLowerCase().includes(term) ||
      (td.member_number || '').toLowerCase().includes(term)
    );
  });

  const totalSavingsBalance = savings.reduce((acc, s) => acc + Number(s.current_balance || 0), 0);
  const totalTermBalance = termDeposits.reduce((acc, td) => acc + Number(td.principal_amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-950 border border-teal-500/20 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
            <PiggyBank className="w-4 h-4" />
            <span>PKPS Banking & Deposit Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Member Savings & Term Deposits
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Administer member thrift deposit balances, issue Fixed Term Deposit certificates, and manage counter cash transactions.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => fetchDepositsData()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowNewFdModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Issue Term Deposit (FD)</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between animate-in fade-in duration-200 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            : 'bg-red-500/15 border-red-500/40 text-red-300'
        }`}>
          <div className="flex items-center space-x-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-75 hover:opacity-100 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs uppercase text-slate-400 font-semibold flex items-center justify-between">
            <span>Total Thrift Savings</span>
            <PiggyBank className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-teal-400 font-mono">
            ₹{totalSavingsBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500">{savings.length} Active Member Accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs uppercase text-slate-400 font-semibold flex items-center justify-between">
            <span>Total Fixed Deposits</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            ₹{totalTermBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500">{termDeposits.length} Certificates Issued</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs uppercase text-slate-400 font-semibold flex items-center justify-between">
            <span>Total Society Deposits</span>
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            ₹{(totalSavingsBalance + totalTermBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500">Working Capital Pool</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs uppercase text-slate-400 font-semibold flex items-center justify-between">
            <span>Total Counter Txns</span>
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-blue-400 font-mono">
            {transactions.length}
          </div>
          <p className="text-[11px] text-slate-500">Immutable Ledger Entries</p>
        </div>
      </div>

      {/* Search Bar & Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('savings')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition ${
              activeTab === 'savings'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
            <span>Savings Accounts ({savings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('term_deposits')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition ${
              activeTab === 'term_deposits'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Fixed Term Deposits ({termDeposits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition ${
              activeTab === 'transactions'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Transaction Ledger ({transactions.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search member, acc no..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Tab 1: Savings Accounts Table */}
      {activeTab === 'savings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Savings Acc No</th>
                  <th className="p-4">Farmer / Member</th>
                  <th className="p-4">Current Balance</th>
                  <th className="p-4">Yield Rate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Counter Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredSavings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                      No savings accounts matched your query.
                    </td>
                  </tr>
                ) : (
                  filteredSavings.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono text-xs text-teal-400 font-bold">{acc.account_number}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-100">{acc.member_name}</div>
                        <div className="text-xs text-slate-400 font-mono">Member ID: {acc.member_number}</div>
                      </td>
                      <td className="p-4 font-bold text-base text-emerald-400 font-mono">
                        ₹{Number(acc.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-slate-300 font-mono text-xs">{acc.interest_rate_pa}% p.a.</td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {acc.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setTransactModal(acc);
                            setAmount('');
                            setRemarks('');
                            setTType('DEPOSIT');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold transition shadow"
                        >
                          Deposit / Withdraw / Interest
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Fixed Term Deposits Table */}
      {activeTab === 'term_deposits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Certificate No</th>
                  <th className="p-4">Member Name</th>
                  <th className="p-4">Principal (₹)</th>
                  <th className="p-4">Interest Rate</th>
                  <th className="p-4">Maturity Date</th>
                  <th className="p-4">Maturity Amount (₹)</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredTermDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                      No term deposit certificates found. Click "Issue Term Deposit (FD)" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredTermDeposits.map((td) => (
                    <tr key={td.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono text-xs text-amber-400 font-bold">{td.deposit_number}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-100">{td.member_name}</div>
                        <div className="text-xs text-slate-400 font-mono">{td.member_number}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-100 font-mono">
                        ₹{Number(td.principal_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-amber-300 font-mono text-xs">{td.interest_rate_pa}% p.a. ({td.tenure_months}m)</td>
                      <td className="p-4 text-xs font-mono text-slate-300">{td.maturity_date}</td>
                      <td className="p-4 font-bold text-emerald-400 font-mono">
                        ₹{Number(td.maturity_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {td.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Transactions Ledger Table */}
      {activeTab === 'transactions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Reference No</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Amount (₹)</th>
                  <th className="p-4">Balance After (₹)</th>
                  <th className="p-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                      No transaction entries recorded yet in ledger.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isCredit = ['DEPOSIT', 'INTEREST_CREDIT'].includes(tx.transaction_type);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-mono text-xs text-slate-400">
                          {new Date(tx.transaction_date).toLocaleDateString()} {new Date(tx.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-200">{tx.reference_number}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 w-fit ${
                            isCredit
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {isCredit ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            <span>{tx.transaction_type.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className={`p-4 font-bold font-mono ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-200">
                          ₹{Number(tx.balance_after).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-xs text-slate-400 max-w-xs truncate">{tx.remarks || 'Counter transaction'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Counter Transaction Modal (Deposit / Withdraw / Interest Credit) */}
      {transactModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Post Savings Transaction</h3>
                <p className="text-xs text-slate-400 font-mono">{transactModal.account_number} • {transactModal.member_name}</p>
              </div>
              <button onClick={() => setTransactModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Transaction Type</label>
                <select
                  value={tType}
                  onChange={(e) => setTType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm font-semibold focus:outline-none focus:border-teal-400"
                >
                  <option value="DEPOSIT">Cash Deposit (+ Credit)</option>
                  <option value="WITHDRAWAL">Cash Withdrawal (- Debit)</option>
                  <option value="INTEREST_CREDIT">Semi-Annual Interest Credit (+ Credit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-xl font-bold font-mono focus:outline-none focus:border-teal-400 text-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Remarks / Counter Voucher No</label>
                <input
                  type="text"
                  placeholder="e.g. Cashier counter receipt / Harvest sale deposit"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300">
                <div className="flex justify-between items-center font-bold">
                  <span>Current Account Balance:</span>
                  <span className="font-mono text-emerald-400">₹{Number(transactModal.current_balance).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransactModal(null)}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transactLoading || !amount}
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow transition disabled:opacity-50"
                >
                  {transactLoading ? 'Posting...' : 'Post to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Issue Term Deposit Modal */}
      {showNewFdModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Coins className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-100">Issue Fixed Term Deposit</h3>
              </div>
              <button onClick={() => setShowNewFdModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTermDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Select Member</label>
                <select
                  required
                  value={fdMemberId}
                  onChange={(e) => setFdMemberId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-amber-400 font-medium"
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.member_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Principal Amount (₹)</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  required
                  value={fdPrincipal}
                  onChange={(e) => setFdPrincipal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-lg font-bold font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Tenure (Months)</label>
                  <select
                    value={fdTenure}
                    onChange={(e) => {
                      setFdTenure(e.target.value);
                      if (e.target.value === '12') setFdRate('7.50');
                      else if (e.target.value === '24') setFdRate('8.00');
                      else setFdRate('8.50');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm font-semibold focus:outline-none focus:border-amber-400"
                  >
                    <option value="12">12 Months (1 Yr)</option>
                    <option value="24">24 Months (2 Yrs)</option>
                    <option value="36">36 Months (3 Yrs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={fdRate}
                    onChange={(e) => setFdRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm font-semibold font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFdModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fdLoading || !fdMemberId}
                  className="w-2/3 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow transition disabled:opacity-50"
                >
                  {fdLoading ? 'Issuing Certificate...' : 'Generate FD Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
