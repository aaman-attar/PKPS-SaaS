import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [chainVerification, setChainVerification] = useState<any>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const [lRes, vRes] = await Promise.all([
        api.get('/audit/logs/'),
        api.get('/audit/logs/verify-chain/'),
      ]);
      setLogs(lRes.data.results || lRes.data);
      setChainVerification(vRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Cryptographic Audit Trail</h1>
        <p className="text-slate-400 text-sm">SHA-256 Hash-Chained Tamper-Evident Security Logs</p>
      </div>

      {/* Hash Chain Verification Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Audit Cryptographic Chain Validation</h3>
            <p className="text-xs text-slate-400">Total Audited Operations: {chainVerification?.total_audited_records || 0}</p>
          </div>
        </div>

        {chainVerification?.chain_intact ? (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cryptographic Chain Intact</span>
          </div>
        ) : (
          <div className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 font-semibold text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Chain Compromised!</span>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">User</th>
              <th className="p-4">Action</th>
              <th className="p-4">Module</th>
              <th className="p-4">Entity</th>
              <th className="p-4 font-mono">SHA-256 Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/50">
                <td className="p-4 text-xs font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-4 font-semibold text-slate-100">{log.username || 'SYSTEM'}</td>
                <td className="p-4 text-emerald-400 font-mono text-xs">{log.action}</td>
                <td className="p-4 text-slate-400 text-xs">{log.module}</td>
                <td className="p-4 text-xs text-slate-300">{log.entity_name} ({log.entity_id})</td>
                <td className="p-4 font-mono text-xs text-cyan-400 truncate max-w-xs">{log.hash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
