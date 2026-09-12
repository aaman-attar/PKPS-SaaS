import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PiggyBank, Landmark } from 'lucide-react';

export const FarmerSavingsPage: React.FC = () => {
  const [savings, setSavings] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);

  useEffect(() => {
    fetchSavingsAndShares();
  }, []);

  const fetchSavingsAndShares = async () => {
    try {
      const [sRes, shRes] = await Promise.all([
        api.get('/deposits/savings/'),
        api.get('/shares/accounts/'),
      ]);
      setSavings(sRes.data.results || sRes.data);
      setShares(shRes.data.results || shRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Savings & Shares</h1>
        <p className="text-slate-400 text-sm">View your thrift savings deposits and cooperative share capital holdings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Savings Account */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <PiggyBank className="w-6 h-6 text-teal-400" />
            <h2 className="text-lg font-semibold text-slate-100">Thrift Savings Account</h2>
          </div>
          {savings.map((s) => (
            <div key={s.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Acc: {s.account_number}</span>
                <span>Rate: {s.interest_rate_pa}% p.a.</span>
              </div>
              <div className="text-2xl font-bold text-teal-400">₹{s.current_balance}</div>
              <p className="text-xs text-slate-500">Status: {s.status}</p>
            </div>
          ))}
        </div>

        {/* Share Capital */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Landmark className="w-6 h-6 text-purple-400" />
            <h2 className="text-lg font-semibold text-slate-100">Share Capital Holding</h2>
          </div>
          {shares.map((sh) => (
            <div key={sh.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Units: {sh.total_shares} Shares</span>
                <span>Unit Price: ₹{sh.share_unit_price}</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">₹{sh.total_amount}</div>
              <p className="text-xs text-slate-500">Cooperative Society Member Capital</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
