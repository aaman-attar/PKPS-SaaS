import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Landmark, Plus, ArrowUpRight, DollarSign } from 'lucide-react';

export const SharesManagementPage: React.FC = () => {
  const [shares, setShares] = useState<any[]>([]);
  const [transactModal, setTransactModal] = useState<any>(null);
  const [numShares, setNumShares] = useState('10');
  const [transactType, setTransactType] = useState('DEPOSIT');

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    try {
      const res = await api.get('/shares/accounts/');
      setShares(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareTransact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactModal) return;
    try {
      await api.post(`/shares/accounts/${transactModal.id}/transact/`, {
        transaction_type: transactType,
        number_of_shares: numShares,
      });
      setTransactModal(null);
      fetchShares();
    } catch (err) {
      alert('Share transaction failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Share Capital & Dividend Ledger</h1>
        <p className="text-slate-400 text-sm">Member share capital contributions, unit holdings, and dividend distribution</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4">Member ID</th>
              <th className="p-4">Farmer Name</th>
              <th className="p-4">Total Shares</th>
              <th className="p-4">Share Value (₹)</th>
              <th className="p-4">Total Amount (₹)</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {shares.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/50">
                <td className="p-4 font-mono text-xs text-purple-400 font-semibold">{s.member_number}</td>
                <td className="p-4 font-semibold text-slate-100">{s.member_name}</td>
                <td className="p-4 font-bold text-slate-200">{s.total_shares} Shares</td>
                <td className="p-4 text-slate-400">₹{s.share_unit_price} / share</td>
                <td className="p-4 font-bold text-purple-400">₹{s.total_amount}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setTransactModal(s)}
                    className="px-3 py-1 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-medium"
                  >
                    Issue / Refund Shares
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Share Transact Modal */}
      {transactModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Transact Share Capital</h3>
            <p className="text-xs text-slate-400 font-mono">Member: {transactModal.member_name} ({transactModal.member_number})</p>

            <form onSubmit={handleShareTransact} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Transaction Type</label>
                <select
                  value={transactType}
                  onChange={(e) => setTransactType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                >
                  <option value="DEPOSIT">Issue / Purchase Shares (+)</option>
                  <option value="WITHDRAWAL">Redeem / Refund Shares (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Number of Shares (₹100 per share)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={numShares}
                  onChange={(e) => setNumShares(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-lg font-bold text-purple-400"
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm"
                >
                  Submit Share Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
