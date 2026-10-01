import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { MembershipApplication } from '../../types';
import { 
  FileText, CheckCircle2, XCircle, Clock, Search, Download, 
  Eye, Filter, RefreshCw, UserCheck, MapPin, Layers, AlertCircle,
  Building2, User, Landmark, ShieldCheck, Sparkles, X
} from 'lucide-react';

export const MembershipApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Approval Assignment Fields
  const [approvalData, setApprovalData] = useState({
    member_number: '',
    board_resolution_no: '',
    board_resolution_date: new Date().toISOString().split('T')[0],
    dccb_sb_account_no: '',
    ledger_folio_no: '',
  });

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

  const openApproveModal = (app: any) => {
    setSelectedApp(app);
    const randNum = Math.floor(100000 + Math.random() * 900000);
    setApprovalData({
      member_number: `M-${randNum}`,
      board_resolution_no: app.board_resolution_no || `RES-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      board_resolution_date: new Date().toISOString().split('T')[0],
      dccb_sb_account_no: app.dccb_sb_account_no || '',
      ledger_folio_no: app.ledger_folio_no || `LF-${Math.floor(10 + Math.random() * 90)}`,
    });
    setShowApprovalModal(true);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setProcessing(true);
    setMsg(null);
    try {
      const res = await api.post(`/members/applications/${selectedApp.id}/approve/`, approvalData);
      setMsg({ type: 'success', text: res.data.message || 'Application approved successfully! Member profile and land record created.' });
      setShowApprovalModal(false);
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
          <h1 className="text-2xl font-bold text-slate-100">Farmer Membership Applications (ಸದಸ್ಯತ್ವ ಅರ್ಜಿಗಳು)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review incoming farmer applications, verify uploaded **Utara land documents**, and approve membership into the society ERP.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st 
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {st === 'PENDING' && 'Pending Verification'}
              {st === 'APPROVED' && 'Approved Members'}
              {st === 'REJECTED' && 'Rejected'}
              {st === 'ALL' && 'All Applications'}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
            <span>Loading applications...</span>
          </div>
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
                  <th className="p-4">Contact & Aadhaar</th>
                  <th className="p-4">Village / Taluk</th>
                  <th className="p-4">Land Holding</th>
                  <th className="p-4">Utara Document</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="font-semibold text-slate-100 text-sm">
                        {app.first_name} {app.middle_name} {app.last_name}
                      </div>
                      {app.local_language_name && (
                        <div className="text-[11px] text-emerald-400 font-sans">{app.local_language_name}</div>
                      )}
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        Applied: {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <div className="font-mono text-slate-200 font-semibold">{app.mobile}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Aadhaar: {app.aadhaar_number || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <div>{app.village}</div>
                      <div className="text-[11px] text-slate-400">{app.taluk}, {app.district}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-emerald-400 font-mono">Sy. No: {app.land_survey_number || 'N/A'}</span>
                      <span className="block text-[11px] text-slate-300">{app.land_area_acres} {app.land_unit || 'Acres'}</span>
                      <span className="block text-[10px] text-slate-500">{app.land_ownership_type || 'Self Owned'}</span>
                    </td>
                    <td className="p-4">
                      {app.utara_document ? (
                        <a
                          href={getDocUrl(app.utara_document)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/20 inline-flex items-center space-x-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View RTC</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">No doc</span>
                      )}
                    </td>
                    <td className="p-4">
                      {app.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold inline-flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Pending Verification</span>
                        </span>
                      )}
                      {app.status === 'APPROVED' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved & Enrolled</span>
                        </span>
                      )}
                      {app.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold inline-flex items-center space-x-1">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Dossier</span>
                      </button>

                      {app.status === 'PENDING' && (
                        <button
                          onClick={() => openApproveModal(app)}
                          disabled={processing}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md inline-flex items-center space-x-1 cursor-pointer transition"
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

      {/* Comprehensive Application Dossier Modal */}
      {selectedApp && !showApprovalModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Membership Application Dossier
                </span>
                <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2 mt-0.5">
                  <span>{selectedApp.first_name} {selectedApp.middle_name} {selectedApp.last_name}</span>
                  {selectedApp.local_language_name && (
                    <span className="text-sm text-emerald-400 font-sans">({selectedApp.local_language_name})</span>
                  )}
                </h3>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 text-slate-400 hover:text-slate-200 rounded-xl bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* 1. Personal & KYC */}
              <div className="p-4 rounded-2xl bg-slate-950 space-y-2 border border-slate-800">
                <h4 className="font-bold text-slate-200 border-b border-slate-800/80 pb-1.5 flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Personal & Identity Details</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div><span className="text-slate-500 block">Father's Name:</span> {selectedApp.father_name || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Spouse's Name:</span> {selectedApp.spouse_name || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Mobile Number:</span> <span className="font-mono">{selectedApp.mobile}</span></div>
                  <div><span className="text-slate-500 block">Aadhaar Number:</span> <span className="font-mono">{selectedApp.aadhaar_number || 'N/A'}</span></div>
                  <div><span className="text-slate-500 block">Gender / DOB:</span> {selectedApp.gender} ({selectedApp.dob || 'N/A'})</div>
                  <div><span className="text-slate-500 block">Marital Status:</span> {selectedApp.marital_status || 'Married'}</div>
                  <div><span className="text-slate-500 block">Email:</span> {selectedApp.email || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Blood Group:</span> {selectedApp.blood_group || 'N/A'}</div>
                </div>
              </div>

              {/* 2. Socio-Economic */}
              <div className="p-4 rounded-2xl bg-slate-950 space-y-2 border border-slate-800">
                <h4 className="font-bold text-slate-200 border-b border-slate-800/80 pb-1.5 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Socio-Economic & Caste</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div><span className="text-slate-500 block">Caste Category:</span> <span className="text-amber-400 font-semibold">{selectedApp.caste_category || 'OBC'}</span></div>
                  <div><span className="text-slate-500 block">Religion:</span> {selectedApp.religion || 'Hindu'}</div>
                  <div><span className="text-slate-500 block">Qualification:</span> {selectedApp.qualification || 'SSLC'}</div>
                  <div><span className="text-slate-500 block">Occupation:</span> {selectedApp.occupation || 'Agriculture'}</div>
                  <div><span className="text-slate-500 block">Annual Income:</span> ₹{Number(selectedApp.annual_income || 0).toLocaleString()}</div>
                  <div><span className="text-slate-500 block">DCCB SB A/C:</span> <span className="font-mono">{selectedApp.dccb_sb_account_no || 'None'}</span></div>
                </div>
              </div>

              {/* 3. Address */}
              <div className="p-4 rounded-2xl bg-slate-950 space-y-2 border border-slate-800">
                <h4 className="font-bold text-slate-200 border-b border-slate-800/80 pb-1.5 flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>Residential Address</span>
                </h4>
                <div className="space-y-1 text-slate-300 pt-1">
                  <div><span className="text-slate-500">Address:</span> {selectedApp.address || 'N/A'}</div>
                  <div><span className="text-slate-500">Village / Town:</span> {selectedApp.village}</div>
                  <div><span className="text-slate-500">Taluk / District:</span> {selectedApp.taluk}, {selectedApp.district}</div>
                  <div><span className="text-slate-500">State / PIN:</span> {selectedApp.state} - {selectedApp.pincode}</div>
                </div>
              </div>

              {/* 4. Land Details */}
              <div className="p-4 rounded-2xl bg-slate-950 space-y-2 border border-slate-800">
                <h4 className="font-bold text-slate-200 border-b border-slate-800/80 pb-1.5 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Land Record (RTC / Utara)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div><span className="text-slate-500 block">Survey Number:</span> <span className="text-emerald-400 font-mono font-bold">{selectedApp.land_survey_number || 'N/A'}</span></div>
                  <div><span className="text-slate-500 block">Area & Unit:</span> {selectedApp.land_area_acres} {selectedApp.land_unit || 'Acres'}</div>
                  <div><span className="text-slate-500 block">Ownership:</span> {selectedApp.land_ownership_type || 'Self Owned'}</div>
                  <div><span className="text-slate-500 block">RTC No:</span> {selectedApp.land_rtc_no || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Crops:</span> {selectedApp.land_crop_type || 'Paddy'}</div>
                  <div><span className="text-slate-500 block">Irrigation:</span> {selectedApp.land_irrigation_type || 'Canal'}</div>
                </div>
              </div>
            </div>

            {/* Official Utara Document Card */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">Official RTC / Utara Land Record Document</h4>
                  <p className="text-xs text-slate-400">Attached by farmer during membership application</p>
                </div>
              </div>
              {selectedApp.utara_document ? (
                <a
                  href={getDocUrl(selectedApp.utara_document)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download / Inspect Document</span>
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
                    className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition cursor-pointer"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => openApproveModal(selectedApp)}
                    disabled={processing}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Proceed to Society Board Approval</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Society Board Resolution & Member Enrollment Assignment Modal */}
      {showApprovalModal && selectedApp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Society Board Resolution & Member Issuance</span>
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                  Approve & Issue Membership for {selectedApp.first_name} {selectedApp.last_name}
                </h3>
              </div>
              <button onClick={() => setShowApprovalModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Assigned Member Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={approvalData.member_number}
                    onChange={(e) => setApprovalData({ ...approvalData, member_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Board Resolution Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={approvalData.board_resolution_date}
                    onChange={(e) => setApprovalData({ ...approvalData, board_resolution_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Board Resolution Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RES-2026-0042"
                  value={approvalData.board_resolution_no}
                  onChange={(e) => setApprovalData({ ...approvalData, board_resolution_no: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    DCCB SB Account No.
                  </label>
                  <input
                    type="text"
                    placeholder="Enter or assign SB account"
                    value={approvalData.dccb_sb_account_no}
                    onChange={(e) => setApprovalData({ ...approvalData, dccb_sb_account_no: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Ledger Folio No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LF-104"
                    value={approvalData.ledger_folio_no}
                    onChange={(e) => setApprovalData({ ...approvalData, ledger_folio_no: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-[11px] leading-relaxed">
                Approving this application will activate the farmer's member record in the PACS ledger, register their survey land holdings, and enable them to apply for loans and deposit shares immediately.
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={processing}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {processing ? 'Enrolling Member...' : 'Confirm & Enroll Member in Society'}
              </button>
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
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold shadow-md cursor-pointer"
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
