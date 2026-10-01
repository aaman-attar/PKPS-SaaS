import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  X, Building2, MapPin, Landmark, User, Mail, Phone,
  CheckCircle2, AlertCircle, Clock, ShieldCheck, Send,
  Copy, ExternalLink, RefreshCw, KeyRound, Sparkles
} from 'lucide-react';

interface Props {
  tenantId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshList: () => void;
}

export const TenantDetailsModal: React.FC<Props> = ({
  tenantId,
  isOpen,
  onClose,
  onRefreshList,
}) => {
  const [tenant, setTenant] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activationLink, setActivationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchTenantDetails();
    } else {
      setTenant(null);
      setErrorMsg(null);
      setSuccessMsg(null);
      setActivationLink(null);
    }
  }, [isOpen, tenantId]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.get(`/tenants/${tenantId}/`);
      setTenant(res.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load tenant details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async () => {
    if (!tenantId) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await api.post(`/tenants/${tenantId}/resend-invitation/`);
      setSuccessMsg(res.data.message || 'Invitation resent successfully!');
      if (res.data.dev_activation_link) {
        setActivationLink(res.data.dev_activation_link);
      }
      fetchTenantDetails();
      onRefreshList();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to resend invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!tenantId) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await api.post(`/tenants/${tenantId}/approve/`);
      setSuccessMsg(res.data.message || 'Tenant approved successfully!');
      if (res.data.dev_activation_link) {
        setActivationLink(res.data.dev_activation_link);
      }
      fetchTenantDetails();
      onRefreshList();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to approve tenant.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!tenantId) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.post(`/tenants/${tenantId}/update-status/`, { status });
      setSuccessMsg(`Status updated to ${status}.`);
      fetchTenantDetails();
      onRefreshList();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {tenant ? tenant.name : 'Loading Society...'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {tenant ? `Code: ${tenant.code}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Activation link banner if generated */}
          {activationLink && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>PKPS Administrator Invitation / Activation Link</span>
                </span>
                <span className="text-[10px] text-slate-400">Valid for 24 hours</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-950/80 border border-emerald-500/30 rounded-xl p-2.5">
                <input
                  type="text"
                  readOnly
                  value={activationLink}
                  className="bg-transparent text-emerald-300 font-mono text-xs w-full focus:outline-none select-all"
                />
                <button
                  onClick={() => copyToClipboard(activationLink)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold flex items-center space-x-1 flex-shrink-0 transition border border-emerald-500/40"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <a
                  href={activationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 underline"
                >
                  <span>Open Activation Form</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <span>Loading society details...</span>
            </div>
          ) : tenant ? (
            <div className="space-y-5">
              {/* Status Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400">Current Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      tenant.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : tenant.status === 'APPROVED'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : tenant.status === 'SUSPENDED'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {tenant.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    Plan: <span className="text-slate-300 font-semibold">{tenant.subscription_plan}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {tenant.status !== 'ACTIVE' && (
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Dispatch Invite</span>
                    </button>
                  )}
                  {tenant.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleStatusUpdate('SUSPENDED')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold transition"
                    >
                      Suspend Tenant
                    </button>
                  ) : tenant.status === 'SUSPENDED' ? (
                    <button
                      onClick={() => handleStatusUpdate('ACTIVE')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                    >
                      Reactivate
                    </button>
                  ) : null}
                </div>
              </div>

              {/* PKPS Administrator Section */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2 text-slate-200 font-semibold">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>PKPS Administrator Account</span>
                  </div>
                  <button
                    onClick={handleResendInvitation}
                    disabled={actionLoading}
                    className="px-3 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium flex items-center space-x-1.5 transition"
                  >
                    <Send className="w-3 h-3" />
                    <span>Resend Invitation Link</span>
                  </button>
                </div>

                {tenant.admin_user ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Name:</span>
                      <span className="text-slate-200 font-medium">{tenant.admin_user.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Username:</span>
                      <span className="text-cyan-400 font-mono font-medium">{tenant.admin_user.username}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Email:</span>
                      <span className="text-slate-200">{tenant.admin_user.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Role:</span>
                      <span className="text-blue-400 font-mono">{tenant.admin_user.role}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Account Status:</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          tenant.admin_user.is_active
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {tenant.admin_user.is_active ? 'Active (Activated)' : 'Pending Invitation Setup'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Invitation Status:</span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {tenant.latest_invitation?.status || 'SENT'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs py-2">
                    No PKPS Admin user provisioned yet.
                  </div>
                )}
              </div>

              {/* Society Registration & Profile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                  <h4 className="font-semibold text-slate-200 flex items-center space-x-2 border-b border-slate-800/80 pb-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Registration Details</span>
                  </h4>
                  <div className="space-y-1.5 pt-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reg Number:</span>
                      <span className="font-mono text-slate-200">{tenant.registration_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Authority:</span>
                      <span>{tenant.profile?.registration_authority || 'RCS'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Society Type:</span>
                      <span>{tenant.society_type || 'PACS'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PAN:</span>
                      <span className="font-mono">{tenant.profile?.pan || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Area of Operation:</span>
                      <span>{tenant.profile?.area_of_operation || 'TALUK'}</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                  <h4 className="font-semibold text-slate-200 flex items-center space-x-2 border-b border-slate-800/80 pb-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span>Office & Address</span>
                  </h4>
                  <div className="space-y-1.5 pt-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Address:</span>
                      <span className="text-right">{tenant.registered_address?.address_line_1 || tenant.address || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Village / Town:</span>
                      <span>{tenant.registered_address?.village_town || tenant.village || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Taluk / District:</span>
                      <span>{tenant.district}, {tenant.state}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PIN Code:</span>
                      <span className="font-mono">{tenant.pincode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact:</span>
                      <span>{tenant.contact_number || tenant.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banking & DCCB Details */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-semibold text-slate-200 flex items-center space-x-2 border-b border-slate-800/80 pb-2">
                  <Landmark className="w-4 h-4 text-cyan-400" />
                  <span>DCCB Affiliation & Banking</span>
                </h4>
                {tenant.bank_accounts && tenant.bank_accounts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 block">Bank Name:</span>
                      <span className="text-slate-200 font-medium">{tenant.bank_accounts[0].bank_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Account Number:</span>
                      <span className="font-mono text-cyan-400 font-semibold">{tenant.bank_accounts[0].account_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Branch & IFSC:</span>
                      <span className="text-slate-300 font-mono">
                        {tenant.bank_accounts[0].branch_name} ({tenant.bank_accounts[0].ifsc_code || 'N/A'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Account Type:</span>
                      <span className="text-slate-300">{tenant.bank_accounts[0].account_type}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1 text-slate-400">
                    DCCB: {tenant.dccb_name || 'Mandya DCCB Bank'} (Standard Operating Account)
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex justify-end bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
