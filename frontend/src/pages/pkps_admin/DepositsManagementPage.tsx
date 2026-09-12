import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PiggyBank, Plus, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const DepositsManagementPage: React.FC = () => {
  const [savings, setSavings] = useState<any[]>([]);
  const [transactModal, setTransactModal] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [tType, setTType] = useState('DEPOSIT');

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      const res = await api.get('/deposits/savings/');
      setSavings(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactModal) return;
    try {
      await api.post(`/deposits/savings/${transactModal.id}/transact/`, {
        transaction_type: tType,
        amount: amount,
      });
      setTransactModal(null);
      setAmount('');
      fetchSavings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Transaction failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Savings & Term Deposits</h1>
        <p className="text-slate-400 text-sm">Member thrift savings accounts, deposits, and interest crediting</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4">Savings Acc No</th>
              <th className="p-4">Farmer Name</th>
              <th className="p-4">Current Balance (₹)</th>
              <th className="p-4">Interest Rate</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {savings.map((acc) => (
              <tr key={acc.id} className="hover:bg-slate-800/50">
                <td className="p-4 font-mono text-xs text-teal-400 font-semibold">{acc.account_number}</td>
                <td className="p-4 font-semibold text-slate-100">{acc.member_name} ({acc.member_number})</td>
                <td className="p-4 font-bold text-teal-400">₹{acc.current_balance}</td>
                <td className="p-4 text-slate-400">{acc.interest_rate_pa}% p.a.</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {acc.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setTransactModal(acc)}
                    className="px-3 py-1 rounded-lg bg-teal-600/20 text-teal-400 hover:bg-teal-600/30 border border-teal-500/30 text-xs font-medium"
                  >
                    Deposit / Withdraw
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {transactModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Savings Account Transaction</h3>
            <p className="text-xs text-slate-400 font-mono">Account: {transactModal.account_number} ({transactModal.member_name})</p>

            <form onSubmit={handleTransact} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Transaction Type</label>
                <select
                  value={tType}
                  onChange={(e) => setTType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                >
                  <option value="DEPOSIT">Cash Deposit (+)</option>
                  <option value="WITHDRAWAL">Cash Withdrawal (-)</option>
                  <option value="INTEREST_CREDIT">Interest Credit (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-lg font-bold text-teal-400"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setTransactModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
