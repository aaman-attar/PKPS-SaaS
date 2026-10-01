import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
  PiggyBank, Landmark, Plus, ArrowDownRight, ArrowUpRight, 
  Clock, ShieldCheck, Coins, Printer, CheckCircle2, 
  Wallet, Percent, Calendar, Sparkles, AlertCircle, RefreshCw, X
} from 'lucide-react';

export const FarmerSavingsPage: React.FC = () => {
  const [savings, setSavings] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [termDeposits, setTermDeposits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'savings' | 'shares' | 'term_deposits'>('savings');

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositRemarks, setDepositRemarks] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  const [showBuySharesModal, setShowBuySharesModal] = useState(false);
  const [numSharesToBuy, setNumSharesToBuy] = useState('5');
  const [sharesLoading, setSharesLoading] = useState(false);

  const [showOpenFdModal, setShowOpenFdModal] = useState(false);
  const [fdPrincipal, setFdPrincipal] = useState('5000');
  const [fdTenure, setFdTenure] = useState('12');
  const [fdLoading, setFdLoading] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [sRes, shRes, tdRes, txRes] = await Promise.all([
        api.get('/deposits/savings/'),
        api.get('/shares/accounts/'),
        api.get('/deposits/term/'),
        api.get('/deposits/transactions/'),
      ]);
      setSavings(sRes.data.results || sRes.data || []);
      setShares(shRes.data.results || shRes.data || []);
      setTermDeposits(tdRes.data.results || tdRes.data || []);
      setTransactions(txRes.data.results || txRes.data || []);
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const primarySavings = savings[0] || null;
  const primaryShares = shares[0] || null;

  // Handle Self-Service Savings Deposit
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primarySavings) return;
    setDepositLoading(true);
    setFeedback(null);
    try {
      await api.post(`/deposits/savings/${primarySavings.id}/transact/`, {
        transaction_type: 'DEPOSIT',
        amount: depositAmount,
        remarks: depositRemarks || 'Self-service farmer portal deposit',
      });
      setFeedback({
        type: 'success',
        message: `₹${Number(depositAmount).toLocaleString('en-IN')} deposited successfully into savings account!`,
      });
      setShowDepositModal(false);
      setDepositAmount('');
      setDepositRemarks('');
      await fetchFinancialData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Deposit transaction could not be processed.',
      });
    } finally {
      setDepositLoading(false);
    }
  };

  // Handle Purchase Shares
  const handleBuySharesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryShares) return;
    setSharesLoading(true);
    setFeedback(null);
    try {
      await api.post(`/shares/accounts/${primaryShares.id}/transact/`, {
        transaction_type: 'DEPOSIT',
        number_of_shares: parseInt(numSharesToBuy, 10),
        remarks: 'Farmer self-service share capital allotment',
      });
      const cost = parseInt(numSharesToBuy, 10) * Number(primaryShares.share_unit_price || 100);
      setFeedback({
        type: 'success',
        message: `Successfully purchased ${numSharesToBuy} shares for ₹${cost.toLocaleString('en-IN')}!`,
      });
      setShowBuySharesModal(false);
      await fetchFinancialData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Share purchase could not be completed.',
      });
    } finally {
      setSharesLoading(false);
    }
  };

  // Handle Open Term Deposit
  const handleOpenFdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFdLoading(true);
    setFeedback(null);
    try {
      const rate = fdTenure === '12' ? '7.50' : fdTenure === '24' ? '8.00' : '8.50';
      await api.post('/deposits/term/', {
        principal_amount: fdPrincipal,
        tenure_months: parseInt(fdTenure, 10),
        interest_rate_pa: rate,
      });
      setFeedback({
        type: 'success',
        message: `Term Deposit for ₹${Number(fdPrincipal).toLocaleString('en-IN')} opened successfully at ${rate}% p.a.!`,
      });
      setShowOpenFdModal(false);
      await fetchFinancialData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to open Fixed Deposit.',
      });
    } finally {
      setFdLoading(false);
    }
  };

  // Calculate live FD maturity for modal
  const calculateMaturity = (p: number, tMonths: number, rate: number) => {
    const interest = (p * rate * tMonths) / 1200;
    return p + interest;
  };

  const totalTermDepositsAmount = termDeposits.reduce(
    (acc, td) => acc + Number(td.principal_amount || 0), 0
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/20 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Cooperative Banking & Thrift Savings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            My Savings & Share Capital
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Manage your PACS Thrift Savings, Term Fixed Deposits (FD), Share Capital holdings, and view real-time passbook statements.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center space-x-2 transition border border-slate-700 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Print Passbook</span>
          </button>
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add / Deposit Funds</span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
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

      {/* Top 3 Quick Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Thrift Savings */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-teal-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Thrift Savings Account</span>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-teal-400 mt-4 tracking-tight">
            ₹{primarySavings ? Number(primarySavings.current_balance).toLocaleString('en-IN') : '0.00'}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80 font-mono">
            <span>Acc: {primarySavings?.account_number || 'Pending'}</span>
            <span className="text-emerald-400 font-semibold">{primarySavings?.interest_rate_pa || 4.0}% p.a.</span>
          </div>
        </div>

        {/* Card 2: Share Capital */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Share Capital Holding</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-400 mt-4 tracking-tight">
            ₹{primaryShares ? Number(primaryShares.total_amount).toLocaleString('en-IN') : '0.00'}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80 font-mono">
            <span>{primaryShares?.total_shares || 0} Units</span>
            <span className="text-purple-300 font-semibold">@ ₹{primaryShares?.share_unit_price || 100}/unit</span>
          </div>
        </div>

        {/* Card 3: Fixed Term Deposits */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fixed Term Deposits (FD)</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-4 tracking-tight">
            ₹{totalTermDepositsAmount.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
            <span>{termDeposits.length} Active FD(s)</span>
            <span className="text-amber-400 font-semibold">Up to 8.5% p.a.</span>
          </div>
        </div>
      </div>

      {/* Facilities Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('savings')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition ${
            activeTab === 'savings'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Thrift Savings & Passbook</span>
        </button>

        <button
          onClick={() => setActiveTab('shares')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition ${
            activeTab === 'shares'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Share Capital Portfolio</span>
        </button>

        <button
          onClick={() => setActiveTab('term_deposits')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition ${
            activeTab === 'term_deposits'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Term Fixed Deposits (FD)</span>
        </button>
      </div>

      {/* Tab 1: Savings Account & Passbook */}
      {activeTab === 'savings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Account Detail Card */}
          {primarySavings ? (
            <div className="bg-slate-900/90 border border-teal-500/20 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Account Holder</div>
                  <div className="text-xl font-bold text-slate-100">{primarySavings.member_name}</div>
                  <div className="text-xs text-slate-400 font-mono">Member ID: {primarySavings.member_number}</div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowDepositModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow flex items-center space-x-2 transition"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Deposit into Savings</span>
                  </button>
                  <button
                    onClick={() => setShowOpenFdModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs flex items-center space-x-2 transition"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Convert to FD</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[11px] uppercase text-slate-400 font-semibold">Account Number</div>
                  <div className="text-base font-bold text-teal-400 font-mono mt-1">{primarySavings.account_number}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[11px] uppercase text-slate-400 font-semibold">Current Balance</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">₹{Number(primarySavings.current_balance).toLocaleString('en-IN')}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[11px] uppercase text-slate-400 font-semibold">Interest Rate</div>
                  <div className="text-base font-bold text-slate-200 mt-1">{primarySavings.interest_rate_pa}% p.a.</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[11px] uppercase text-slate-400 font-semibold">Account Status</div>
                  <div className="flex items-center space-x-1.5 mt-1 text-emerald-400 font-bold text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{primarySavings.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <PiggyBank className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-slate-300 font-medium">No savings account found.</p>
              <p className="text-slate-500 text-xs">Accounts are automatically initialized for active society members.</p>
            </div>
          )}

          {/* Real-time Passbook Statement Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-slate-100 text-base">Passbook Statement History</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {transactions.length} record(s) logged
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm font-medium">No transactions recorded yet in passbook.</p>
                <p className="text-xs">Use the "Add / Deposit Funds" button above to make your first thrift deposit.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Txn Date</th>
                      <th className="p-4">Reference No</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Amount (₹)</th>
                      <th className="p-4">Balance After (₹)</th>
                      <th className="p-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium">
                    {transactions.map((tx) => {
                      const isCredit = ['DEPOSIT', 'INTEREST_CREDIT'].includes(tx.transaction_type);
                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 text-xs text-slate-400 font-mono">
                            {new Date(tx.transaction_date).toLocaleDateString()} {new Date(tx.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-300">{tx.reference_number}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1 w-fit ${
                              isCredit 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}>
                              {isCredit ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                              <span>{tx.transaction_type.replace('_', ' ')}</span>
                            </span>
                          </td>
                          <td className={`p-4 font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-200">
                            ₹{Number(tx.balance_after).toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 text-xs text-slate-400 max-w-xs truncate">{tx.remarks || 'Standard Transaction'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Share Capital Holding */}
      {activeTab === 'shares' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-purple-500/20 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="space-y-1">
                <div className="text-xs uppercase text-purple-400 font-semibold tracking-wider">Cooperative Shareholding</div>
                <div className="text-xl font-bold text-slate-100">{primaryShares?.member_name || 'Member'}</div>
                <div className="text-xs text-slate-400">Class A Voting Member of PKPS Cooperative Society</div>
              </div>

              <button
                onClick={() => setShowBuySharesModal(true)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center space-x-2 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Purchase Additional Shares</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Share Units</span>
                <div className="text-3xl font-extrabold text-purple-400">{primaryShares?.total_shares || 0} Shares</div>
                <p className="text-[11px] text-slate-500">Each share confers cooperative voting privileges</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Face Value / Unit</span>
                <div className="text-3xl font-extrabold text-slate-100">₹{primaryShares?.share_unit_price || 100}</div>
                <p className="text-[11px] text-slate-500">Standard cooperative face value per unit</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Capital Invested</span>
                <div className="text-3xl font-extrabold text-emerald-400">₹{primaryShares ? Number(primaryShares.total_amount).toLocaleString('en-IN') : 0}</div>
                <p className="text-[11px] text-slate-500">Qualifies for annual cooperative society dividend</p>
              </div>
            </div>

            {/* Cooperative Share Capital Benefits */}
            <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-300 space-y-2">
              <div className="font-bold flex items-center space-x-2 text-purple-200">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>PACS Cooperative Shareholder Privileges</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>Eligibility to apply for subsidized Crop Loans (Zero percent interest up to ₹3,00,000).</li>
                <li>Full voting rights in the Annual General Body Meeting (AGM) and Committee elections.</li>
                <li>Annual Dividend payout declared by society net profits.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Term Fixed Deposits (FD) */}
      {activeTab === 'term_deposits' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Fixed & Term Deposits (FD)</h2>
              <p className="text-xs text-slate-400">High-yield term deposit schemes guaranteed by the Cooperative Society</p>
            </div>
            <button
              onClick={() => setShowOpenFdModal(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Open New Term Deposit</span>
            </button>
          </div>

          {termDeposits.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <Coins className="w-10 h-10 text-amber-500/60 mx-auto" />
              <h4 className="text-slate-200 font-bold text-base">No Active Term Deposits</h4>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Open a Fixed Deposit with PKPS to earn guaranteed higher interest returns (up to 8.5% p.a.) funded directly from your thrift savings account.
              </p>
              <button
                onClick={() => setShowOpenFdModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center space-x-1.5"
              >
                <span>Start Fixed Deposit Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {termDeposits.map((td) => (
                <div key={td.id} className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="font-mono text-xs font-bold text-amber-400">{td.deposit_number}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {td.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-semibold">Principal Deposit</div>
                      <div className="text-2xl font-extrabold text-slate-100 mt-1">₹{Number(td.principal_amount).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 uppercase font-semibold">Maturity Payout</div>
                      <div className="text-2xl font-extrabold text-emerald-400 mt-1">₹{Number(td.maturity_amount).toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Interest Rate</span>
                      <span className="font-bold text-amber-300">{td.interest_rate_pa}% p.a.</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tenure</span>
                      <span className="font-bold text-slate-200">{td.tenure_months} Months</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Opened Date</span>
                      <span className="text-slate-300">{td.start_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Maturity Date</span>
                      <span className="text-emerald-300 font-bold">{td.maturity_date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Self-Service Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <PiggyBank className="w-6 h-6 text-teal-400" />
                <h3 className="text-lg font-bold text-slate-100">Add / Deposit Funds</h3>
              </div>
              <button onClick={() => setShowDepositModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Select or Enter Amount (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-mono text-lg font-bold focus:outline-none focus:border-teal-400"
                />
                
                {/* Quick Selection Buttons */}
                <div className="flex space-x-2 mt-2">
                  {['500', '1000', '2500', '5000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDepositAmount(preset)}
                      className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition"
                    >
                      +₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Deposit Remarks / Source
                </label>
                <input
                  type="text"
                  value={depositRemarks}
                  onChange={(e) => setDepositRemarks(e.target.value)}
                  placeholder="e.g. Milk billing payment / Crop sale"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 space-y-1">
                <div className="font-semibold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Instant Credit to Society Passbook</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Deposited funds earn 4.00% annual interest credited semi-annually.
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depositLoading || !depositAmount}
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow transition disabled:opacity-50"
                >
                  {depositLoading ? 'Processing...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Purchase Shares Modal */}
      {showBuySharesModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Landmark className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-bold text-slate-100">Purchase Additional Shares</h3>
              </div>
              <button onClick={() => setShowBuySharesModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBuySharesSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Number of Shares to Purchase (@ ₹{primaryShares?.share_unit_price || 100}/share)
                </label>
                <select
                  value={numSharesToBuy}
                  onChange={(e) => setNumSharesToBuy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-mono text-base font-bold focus:outline-none focus:border-purple-400"
                >
                  <option value="5">5 Shares — ₹500</option>
                  <option value="10">10 Shares — ₹1,000</option>
                  <option value="25">25 Shares — ₹2,500</option>
                  <option value="50">50 Shares — ₹5,000</option>
                  <option value="100">100 Shares — ₹10,000</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-2">
                <div className="flex justify-between font-bold text-purple-200">
                  <span>Investment Total:</span>
                  <span className="text-base text-purple-400 font-mono">
                    ₹{(parseInt(numSharesToBuy, 10) * Number(primaryShares?.share_unit_price || 100)).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Additional share capital increases your cooperative credit borrowing limit for seasonal crop loans.
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBuySharesModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharesLoading}
                  className="w-2/3 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow transition disabled:opacity-50"
                >
                  {sharesLoading ? 'Allotting Shares...' : 'Confirm Share Allotment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Open Term Fixed Deposit Modal */}
      {showOpenFdModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Coins className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-100">Open Fixed Deposit (FD)</h3>
              </div>
              <button onClick={() => setShowOpenFdModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenFdSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Principal Amount (₹)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  required
                  value={fdPrincipal}
                  onChange={(e) => setFdPrincipal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-mono text-lg font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Tenure & Guaranteed Yield
                </label>
                <select
                  value={fdTenure}
                  onChange={(e) => setFdTenure(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-mono text-sm font-semibold focus:outline-none focus:border-amber-400"
                >
                  <option value="12">12 Months (1 Year) — 7.50% p.a.</option>
                  <option value="24">24 Months (2 Years) — 8.00% p.a.</option>
                  <option value="36">36 Months (3 Years) — 8.50% p.a.</option>
                </select>
              </div>

              {/* Live Maturity Calculator Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <div className="flex justify-between items-center text-amber-200">
                  <span>Guaranteed Maturity Payout:</span>
                  <span className="text-xl font-extrabold text-amber-300 font-mono">
                    ₹{calculateMaturity(
                      Number(fdPrincipal || 0),
                      parseInt(fdTenure, 10),
                      fdTenure === '12' ? 7.5 : fdTenure === '24' ? 8.0 : 8.5
                    ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Interest Earned:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    +₹{(
                      calculateMaturity(
                        Number(fdPrincipal || 0),
                        parseInt(fdTenure, 10),
                        fdTenure === '12' ? 7.5 : fdTenure === '24' ? 8.0 : 8.5
                      ) - Number(fdPrincipal || 0)
                    ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenFdModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fdLoading || !fdPrincipal}
                  className="w-2/3 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow transition disabled:opacity-50"
                >
                  {fdLoading ? 'Creating Deposit...' : 'Confirm & Open FD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
