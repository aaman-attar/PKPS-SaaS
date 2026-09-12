import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Building2, Users, CheckCircle, Clock, Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SuperAdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        api.get('/reports/dashboard/'),
        api.get('/tenants/'),
      ]);
      setMetrics(mRes.data);
      setTenants(tRes.data.results || tRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading SaaS metrics...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">SaaS Super Admin Overview</h1>
        <p className="text-slate-400 text-sm">Global PKPS/PACS Organization Management & Monitoring</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total PKPS Tenants</span>
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 mt-4">{metrics?.total_tenants || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Active Societies</span>
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-4">{metrics?.active_tenants || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Pending Approvals</span>
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mt-4">{metrics?.pending_tenants || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Registered Members</span>
            <Users className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 mt-4">{metrics?.total_members || 0}</div>
        </div>
      </div>

      {/* PKPS Organizations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-100">PKPS / PACS Organizations</h2>
          <Link
            to="/admin/tenants"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
          >
            Manage Tenants
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4">PKPS Name</th>
                <th className="p-4">Code</th>
                <th className="p-4">District / State</th>
                <th className="p-4">DCCB Bank</th>
                <th className="p-4">Status</th>
                <th className="p-4">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-semibold text-slate-100">{t.name}</td>
                  <td className="p-4 font-mono text-xs text-blue-400">{t.code}</td>
                  <td className="p-4">{t.district}, {t.state}</td>
                  <td className="p-4 text-slate-400">{t.dccb_name}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        t.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-purple-400">{t.subscription_plan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
