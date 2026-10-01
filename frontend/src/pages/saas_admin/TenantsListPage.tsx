import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
  Building2, Plus, CheckCircle2, XCircle, AlertCircle, 
  Search, Filter, ShieldCheck, Mail, UserCheck, ExternalLink, 
  Layers, Clock, MoreVertical, Eye, Send, RefreshCw
} from 'lucide-react';
import { RegisterPKPSModal } from './RegisterPKPSModal';
import { TenantDetailsModal } from './TenantDetailsModal';

export const TenantsListPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Notification banners
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTenants();
  }, [statusFilter, planFilter]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (planFilter) params.plan = planFilter;
      if (searchTerm) params.q = searchTerm;

      const res = await api.get('/tenants/', { params });
      setTenants(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTenants();
  };

  const handleQuickApprove = async (id: string, name: string) => {
    try {
      const res = await api.post(`/tenants/${id}/approve/`);
      setFeedbackMsg({
        type: 'success',
        text: `Society "${name}" approved. Invitation dispatched to PKPS Administrator.`,
      });
      fetchTenants();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to approve society.',
      });
    }
  };

  const handleQuickStatus = async (id: string, status: string) => {
    try {
      await api.post(`/tenants/${id}/update-status/`, { status });
      setFeedbackMsg({
        type: 'success',
        text: `Tenant status updated to ${status}.`,
      });
      fetchTenants();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to update status.',
      });
    }
  };

  const openDetails = (id: string) => {
    setSelectedTenantId(id);
    setShowDetailsModal(true);
  };

  // Status badge styling helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Active ERP</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center space-x-1 w-fit">
            <span>Approved (Invited)</span>
          </span>
        );
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1 w-fit">
            <Clock className="w-3 h-3" />
            <span>Review Pending</span>
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center space-x-1 w-fit">
            <XCircle className="w-3 h-3" />
            <span>Suspended</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 w-fit">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center space-x-2.5">
            <Building2 className="w-7 h-7 text-blue-500" />
            <span>PKPS Society Organizations (Tenants)</span>
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Register, approve, and provision PACS societies with dedicated isolated tenant databases
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center space-x-2 shadow-lg shadow-blue-600/25 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>Register New PKPS Society</span>
        </button>
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex justify-between items-center ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-white text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 w-full flex items-center relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by society name, code, district, or reg number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="ml-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="APPROVED">Approved</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Plans</option>
            <option value="TRIAL">Trial</option>
            <option value="BASIC">Basic</option>
            <option value="STANDARD">Standard</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setPlanFilter('');
              fetchTenants();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 font-semibold">Tenant Code</th>
                <th className="p-4 font-semibold">PKPS Society Name</th>
                <th className="p-4 font-semibold">District / State</th>
                <th className="p-4 font-semibold">Plan</th>
                <th className="p-4 font-semibold">Admin Account</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading PKPS societies...</span>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-slate-400 font-medium">No PKPS societies found matching criteria.</p>
                    <p className="text-xs text-slate-600 mt-1">Click "Register New PKPS Society" to onboard your first PACS.</p>
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono text-xs text-blue-400 font-semibold">
                      {t.code}
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-100 flex items-center space-x-1.5">
                        <span>{t.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t.society_type || 'PACS'}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-200">{t.district || 'Karnataka'}</div>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {t.subscription_plan || 'STANDARD'}
                      </span>
                    </td>

                    <td className="p-4">
                      {t.admin_name ? (
                        <div>
                          <div className="text-xs font-medium text-slate-200">{t.admin_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{t.admin_email}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Not Provisioned</span>
                      )}
                    </td>

                    <td className="p-4">
                      {renderStatusBadge(t.status)}
                    </td>

                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openDetails(t.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium inline-flex items-center space-x-1 border border-slate-700 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Details</span>
                      </button>

                      {t.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleQuickApprove(t.id, t.name)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold inline-flex items-center space-x-1 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {t.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleQuickStatus(t.id, 'SUSPENDED')}
                          className="px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30 text-xs font-medium inline-flex items-center space-x-1 transition"
                        >
                          <span>Suspend</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Multi-Step Modal */}
      <RegisterPKPSModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={() => {
          fetchTenants();
        }}
      />

      {/* Tenant Details Drawer / Modal */}
      <TenantDetailsModal
        isOpen={showDetailsModal}
        tenantId={selectedTenantId}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTenantId(null);
        }}
        onRefreshList={fetchTenants}
      />
    </div>
  );
};
