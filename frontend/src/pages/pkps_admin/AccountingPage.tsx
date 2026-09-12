import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BookOpen, Scale, Plus, CheckCircle2 } from 'lucide-react';

export const AccountingPage: React.FC = () => {
  const [accountHeads, setAccountHeads] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'heads' | 'entries' | 'trial'>('heads');

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    try {
      const [hRes, eRes, tRes] = await Promise.all([
        api.get('/accounting/heads/'),
        api.get('/accounting/entries/'),
        api.get('/accounting/entries/trial-balance/'),
      ]);
      setAccountHeads(hRes.data.results || hRes.data);
      setJournalEntries(eRes.data.results || eRes.data);
      setTrialBalance(tRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Financial Accounting System (FAS)</h1>
        <p className="text-slate-400 text-sm">Double-Entry General Ledger, Chart of Accounts & Trial Balance</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('heads')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'heads' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Chart of Accounts
        </button>
        <button
          onClick={() => setActiveTab('entries')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'entries' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Journal Vouchers
        </button>
        <button
          onClick={() => setActiveTab('trial')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'trial' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Trial Balance Verification
        </button>
      </div>

      {/* Tab 1: Chart of Accounts */}
      {activeTab === 'heads' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">Account Code</th>
                <th className="p-4">Account Title</th>
                <th className="p-4">Category / Type</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {accountHeads.map((h) => (
                <tr key={h.id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-mono text-xs text-blue-400 font-semibold">{h.code}</td>
                  <td className="p-4 font-semibold text-slate-100">{h.name}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                      {h.type}
                    </span>
                  </td>
                  <td className="p-4 text-emerald-400 font-medium">Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Journal Entries */}
      {activeTab === 'entries' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">Voucher No</th>
                <th className="p-4">Date</th>
                <th className="p-4">Narration</th>
                <th className="p-4">Posted By</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {journalEntries.map((j) => (
                <tr key={j.id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-mono text-xs text-emerald-400 font-semibold">{j.entry_number}</td>
                  <td className="p-4">{j.date}</td>
                  <td className="p-4 text-slate-300">{j.narration}</td>
                  <td className="p-4 text-slate-400">{j.posted_by_name || 'System'}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {j.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Trial Balance */}
      {activeTab === 'trial' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center space-x-3">
              <Scale className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-slate-100">Trial Balance Integrity Check</h3>
                <p className="text-xs text-slate-400">Verifies sum of all debits equals sum of all credits</p>
              </div>
            </div>
            {trialBalance?.is_balanced ? (
              <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Balanced (₹{trialBalance.grand_debit})</span>
              </span>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 font-semibold text-xs">
                Unbalanced
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-4">Account Code</th>
                  <th className="p-4">Account Title</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Debit (₹)</th>
                  <th className="p-4 text-right">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trialBalance?.accounts?.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-800/50">
                    <td className="p-4 font-mono text-xs text-blue-400">{a.code}</td>
                    <td className="p-4 font-semibold text-slate-100">{a.name}</td>
                    <td className="p-4 text-slate-400">{a.type}</td>
                    <td className="p-4 text-right font-mono text-emerald-400">₹{a.debit}</td>
                    <td className="p-4 text-right font-mono text-blue-400">₹{a.credit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
