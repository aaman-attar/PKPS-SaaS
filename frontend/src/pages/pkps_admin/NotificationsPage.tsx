import React, { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Check } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'New Membership Application Submitted',
      message: 'Farmer Mahesh Gowda (Mandya Rural) submitted a new membership application.',
      type: 'INFO',
      timestamp: '10 minutes ago',
      read: false
    },
    {
      id: '2',
      title: 'Loan Disbursed Successfully',
      message: 'Loan LN-000234 (₹1,00,000) disbursed to Ramesh Patil.',
      type: 'SUCCESS',
      timestamp: '2 hours ago',
      read: false
    },
    {
      id: '3',
      title: 'Loan Repayment Due Alert',
      message: '3 farmer loan accounts are due for repayment within 7 days.',
      type: 'WARNING',
      timestamp: '1 day ago',
      read: true
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Society Notification Center</h1>
              <p className="text-slate-400 text-xs mt-0.5">Real-time alerts for loan disbursements, repayments, KYC approvals & governance updates.</p>
            </div>
          </div>
        </div>

        <button
          onClick={markAllAsRead}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-2 transition"
        >
          <Check className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition flex items-start justify-between ${
              n.read ? 'bg-slate-950/40 border-slate-800/50 opacity-70' : 'bg-slate-950/90 border-slate-700 shadow-md'
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div className="mt-0.5">
                {n.type === 'SUCCESS' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {n.type === 'WARNING' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {n.type === 'INFO' && <Info className="w-5 h-5 text-blue-400" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{n.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{n.timestamp}</span>
                </div>
              </div>
            </div>

            {!n.read && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse mt-1"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
