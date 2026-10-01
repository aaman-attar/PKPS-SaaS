import React, { useState } from 'react';
import { Users, Calendar, FileText, CheckCircle2, Plus, Sparkles, Award } from 'lucide-react';

export const GovernancePage: React.FC = () => {
  const [meetings] = useState([
    {
      id: 'MTG-2026-08',
      title: 'Monthly Executive Committee Meeting',
      date: '2026-09-15',
      time: '10:30 AM',
      location: 'PKPS Board Room, Mandya',
      status: 'COMPLETED',
      resolutionsCount: 4,
      attendees: 9
    },
    {
      id: 'MTG-2026-09',
      title: 'Kharif Loan Sanctioning Special Meeting',
      date: '2026-09-28',
      time: '11:00 AM',
      location: 'PKPS Main Office Hall',
      status: 'SCHEDULED',
      resolutionsCount: 2,
      attendees: 11
    }
  ]);

  const [resolutions] = useState([
    {
      id: 'RES-2026-042',
      meetingId: 'MTG-2026-08',
      title: 'Approval of Seasonal Agriculture Loans for Kharif 2026',
      proposedBy: 'Suresh Gowda (President)',
      status: 'PASSED',
      passedDate: '2026-09-15',
      description: 'Sanction of short-term crop loans up to ₹3,00,000 per eligible farmer member at 7% p.a.'
    },
    {
      id: 'RES-2026-043',
      meetingId: 'MTG-2026-08',
      title: 'Declaration of Annual Share Dividend (8.5%)',
      proposedBy: 'Ramesh Patil (Director)',
      status: 'PASSED',
      passedDate: '2026-09-15',
      description: 'Distribution of 8.5% annual dividend on paid-up share capital for FY 2025-26.'
    }
  ]);

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PACS Governance & Executive Oversight</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Committee Meetings & Resolutions</h1>
          <p className="text-slate-400 text-sm mt-1">
            Maintain board resolutions, committee meeting minutes, agendas, and policy decisions for auditor inspection.
          </p>
        </div>

        <button className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 flex items-center space-x-2 transition">
          <Plus className="w-4 h-4" />
          <span>Schedule Meeting</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Board Meetings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">Board & Committee Meetings</h2>
            </div>
          </div>

          <div className="space-y-3">
            {meetings.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/40 transition flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-purple-400">{m.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mt-1">{m.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{m.date} at {m.time} • {m.location}</p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">{m.attendees} Members</div>
                  <div className="text-xs font-semibold text-purple-400">{m.resolutionsCount} Resolutions</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Board Resolutions */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">Passed Board Resolutions</h2>
            </div>
          </div>

          <div className="space-y-3">
            {resolutions.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 transition space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-400">{r.id}</span>
                  <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{r.status}</span>
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{r.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{r.description}</p>
                <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-900">
                  <span>Proposed: {r.proposedBy}</span>
                  <span>Date: {r.passedDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
