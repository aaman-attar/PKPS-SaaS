import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { MembershipApplication } from '../../types';
import { 
  FileText, CheckCircle2, XCircle, Clock, Search, Download, 
  Eye, Filter, RefreshCw, UserCheck, MapPin, Layers, AlertCircle 
} from 'lucide-react';

export const MembershipApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/members/applications/');
      const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setApplications(list);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to load membership applications.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId: string) => {
    setProcessing(true);
    setMsg(null);
    try {
      const res = await api.post(`/members/applications/${appId}/approve/`);
      setMsg({ type: 'success', text: res.data.message || 'Application approved successfully!' });
      setSelectedApp(null);
      fetchApplications();
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to approve application.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setProcessing(true);
    setMsg(null);
    try {
      const res = await api.post(`/members/applications/${selectedApp.id}/reject/`, {
        reason: rejectReason || 'Application rejected by PKPS Administrator.'
      });
      setMsg({ type: 'success', text: res.data.message || 'Application rejected.' });
      setShowRejectModal(false);
      setSelectedApp(null);
      setRejectReason('');
      fetchApplications();
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to reject application.' });
    } finally {
      setProcessing(false);
    }
  };

  const getDocUrl = (docPath?: string) => {
    if (!docPath) return '#';
    if (docPath.startsWith('http://') || docPath.startsWith('https://')) return docPath;
    return `http://localhost:8000${docPath.startsWith('/') ? '' : '/'}${docPath}`;
  };

  const filtered = (Array.isArray(applications) ? applications : []).filter(app => {
    const matchesFilter = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesSearch = 
      (app.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (app.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (app.mobile || '').includes(search) ||
      (app.land_survey_number && app.land_survey_number.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });


  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/20 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Society Verification Desk</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Farmer Membership Applications</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review incoming farmer applications, verify uploaded **Utara land documents**, and approve membership.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border border-red-500/30 text-red-300'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, mobile, Sy. No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st 
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {st === 'PENDING' && 'Pending Verification'}
              {st === 'APPROVED' && 'Approved'}
              {st === 'REJECTED' && 'Rejected'}
              {st === 'ALL' && 'All Applications'}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold text-sm">No applications found</p>
            <p className="text-slate-500 text-xs">No membership applications matching filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Applicant Name</th>
                  <th className="p-4">Mobile & Aadhaar</th>
                  <th className="p-4">Village</th>
                  <th className="p-4">Land Sy. No. / Area</th>
                  <th className="p-4">Utara Document</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-semibold text-slate-100">
                      {app.first_name} {app.last_name}
                      <span className="block text-[11px] text-slate-500 font-normal">
                        Applied: {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <div className="font-mono text-slate-300">{app.mobile}</div>
                      <div className="text-[11px] text-slate-400">Aadhaar: {app.aadhaar_number || 'N/A'}</div>
                    </td>
                    <td className="p-4">{app.village}</td>
                    <td className="p-4">
                      <span className="font-semibold text-emerald-400">{app.land_survey_number || 'N/A'}</span>
                      <span className="block text-[11px] text-slate-400">{app.land_area_acres} Acres</span>
                    </td>
                    <td className="p-4">
                      {app.utara_document ? (
                        <a
                          href={getDocUrl(app.utara_document)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/20 inline-flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>View Utara</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">No doc</span>
                      )}
                    </td>
                    <td className="p-4">
                      {app.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold inline-flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                      {app.status === 'APPROVED' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      )}
                      {app.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold inline-flex items-center space-x-1">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      {app.status === 'PENDING' && (
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={processing}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md inline-flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details & Inspection Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">Application Verification</span>
                <h3 className="text-xl font-bold text-slate-100">{selectedApp.first_name} {selectedApp.last_name}</h3>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-200 text-lg">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 space-y-2 border border-slate-800">
                <span className="font-bold text-slate-300 block">Personal Information</span>
                <div><span className="text-slate-500">Father Name:</span> {selectedApp.father_name || 'N/A'}</div>
                <div><span className="text-slate-500">Mobile:</span> {selectedApp.mobile}</div>
                <div><span className="text-slate-500">Aadhaar:</span> {selectedApp.aadhaar_number || 'N/A'}</div>
                <div><span className="text-slate-500">Gender / DOB:</span> {selectedApp.gender} ({selectedApp.dob || 'N/A'})</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 space-y-2 border border-slate-800">
                <span className="font-bold text-slate-300 block">Address & Land Info</span>
                <div><span className="text-slate-500">Village:</span> {selectedApp.village}, {selectedApp.taluk}</div>
                <div><span className="text-slate-500">Sy. Number:</span> <strong className="text-emerald-400">{selectedApp.land_survey_number}</strong></div>
                <div><span className="text-slate-500">Land Area:</span> {selectedApp.land_area_acres} Acres</div>
              </div>
            </div>

            {/* Utara Document Banner */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">Official Utara (RTC) Document</h4>
                  <p className="text-xs text-slate-400">Uploaded land ownership record document</p>
                </div>
              </div>
              {selectedApp.utara_document ? (
                <a
                  href={getDocUrl(selectedApp.utara_document)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>View / Download Utara</span>
                </a>

              ) : (
                <span className="text-xs text-slate-500 italic">No document attached</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              {selectedApp.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                    className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    disabled={processing}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition"
                  >
                    {processing ? 'Processing...' : 'Approve & Create Active Member'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100">Reject Membership Application</h3>
            <p className="text-xs text-slate-400">Specify reason for rejecting farmer's application:</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid Utara document, survey number mismatch..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 text-xs focus:border-red-500 focus:outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
