import React, { useState } from 'react';
import { FileSpreadsheet, Download, Printer, Filter, Calendar, Landmark, BookOpen, PieChart, TrendingUp, Sparkles } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<'DAYBOOK' | 'CASHBOOK' | 'TRIAL_BALANCE' | 'PNL' | 'BALANCE_SHEET' | 'OVERDUE_LOANS'>('DAYBOOK');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-19');

  const reportModules = [
    { id: 'DAYBOOK', title: 'PACS Day Book', desc: 'Daily chronologically ordered receipts & payments', icon: BookOpen },
    { id: 'CASHBOOK', title: 'Cash & Bank Book', desc: 'Cash in hand & Bank balance movement', icon: Landmark },
    { id: 'TRIAL_BALANCE', title: 'Trial Balance', desc: 'Debit vs Credit head balance matching', icon: FileSpreadsheet },
    { id: 'PNL', title: 'Profit & Loss Statement', desc: 'Income vs Expenditure summary', icon: TrendingUp },
    { id: 'BALANCE_SHEET', title: 'Balance Sheet', desc: 'Assets, Liabilities & Share Capital', icon: PieChart },
    { id: 'OVERDUE_LOANS', title: 'Loan Overdue & NPA', desc: 'Recovery tracking & overdue installments', icon: Filter },
  ];

  const handleExportCSV = () => {
    alert(`Exporting ${selectedReport} report to CSV format for range ${startDate} to ${endDate}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:space-y-4 print:p-0">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl print:hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PACS Statutory Financial Reports</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Financial & ERP Reporting Engine</h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate audit-ready statutory reports, Trial Balance, P&L, Balance Sheet, Cash Book, and Loan Recovery Statements.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-slate-100 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Selected Period: <strong className="text-emerald-400">{startDate}</strong> to <strong className="text-emerald-400">{endDate}</strong>
        </div>
      </div>

      {/* Report Types Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
        {reportModules.map((m) => {
          const Icon = m.icon;
          const isSelected = selectedReport === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedReport(m.id as any)}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div>
                <h3 className="text-xs font-bold leading-tight">{m.title}</h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* Report Preview Canvas */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Printable Header */}
        <div className="border-b border-slate-800 print:border-black pb-4 text-center">
          <h2 className="text-xl font-bold text-slate-100 print:text-black uppercase tracking-wider">Mandya Primary Agricultural Credit Society</h2>
          <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">Registration No: MND/PACS/2026/045 • Mandya Rural, Mandya, Karnataka</p>
          <div className="mt-3 inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 print:bg-gray-100 print:text-black print:border-gray-300 text-xs font-bold">
            {reportModules.find(m => m.id === selectedReport)?.title} ({startDate} to {endDate})
          </div>
        </div>

        {/* Sample Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 print:text-black">
            <thead className="bg-slate-950/70 print:bg-gray-100 text-slate-400 print:text-gray-700 uppercase font-mono border-b border-slate-800 print:border-black">
              <tr>
                <th className="px-4 py-3">Code / Ref</th>
                <th className="px-4 py-3">Account Head / Description</th>
                <th className="px-4 py-3 text-right">Debit (₹)</th>
                <th className="px-4 py-3 text-right">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
              <tr>
                <td className="px-4 py-3 font-mono text-emerald-400 print:text-black">1001</td>
                <td className="px-4 py-3 font-semibold">Cash in Hand / Bank Balance</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">1,45,250.00</td>
                <td className="px-4 py-3 text-right font-mono text-slate-500">0.00</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-emerald-400 print:text-black">1101</td>
                <td className="px-4 py-3 font-semibold">Loans & Advances Outstanding</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">4,20,000.00</td>
                <td className="px-4 py-3 text-right font-mono text-slate-500">0.00</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-emerald-400 print:text-black">2001</td>
                <td className="px-4 py-3 font-semibold">Member Savings Deposits</td>
                <td className="px-4 py-3 text-right font-mono text-slate-500">0.00</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">2,15,000.00</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-emerald-400 print:text-black">3001</td>
                <td className="px-4 py-3 font-semibold">Member Share Capital</td>
                <td className="px-4 py-3 text-right font-mono text-slate-500">0.00</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">3,25,250.00</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-emerald-400 print:text-black">4001</td>
                <td className="px-4 py-3 font-semibold">Loan Interest Income Collected</td>
                <td className="px-4 py-3 text-right font-mono text-slate-500">0.00</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">25,000.00</td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-950 print:bg-gray-200 border-t-2 border-slate-700 print:border-black font-bold">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right text-slate-200 print:text-black uppercase">Total Head Balance:</td>
                <td className="px-4 py-3 text-right font-mono text-emerald-400 print:text-black">₹5,65,250.00</td>
                <td className="px-4 py-3 text-right font-mono text-emerald-400 print:text-black">₹5,65,250.00</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
