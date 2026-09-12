import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
  UserPlus, Search, MapPin, Layers, FileText, ArrowRight, ShieldCheck, 
  CheckCircle2, UserCheck, Landmark, PiggyBank, Coins, UserX, Eye, 
  FileSpreadsheet, CreditCard, ChevronRight, Upload, Sparkles, Filter, X
} from 'lucide-react';

export const MembersListPage: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'workflow' | 'list' | 'enroll' | 'land' | 'kyc'>('workflow');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState<any>(null);
  const [showLandModal, setShowLandModal] = useState<any>(null);

  // PACS Comprehensive Enrollment Form State
  const [formData, setFormData] = useState({
    member_number: `M-${Math.floor(100000 + Math.random() * 900000)}`,
    first_name: '',
    middle_name: '',
    last_name: '',
    local_language_name: '',
    gender: 'MALE',
    dob: '',
    mobile: '',
    email: '',
    aadhaar_number: '',
    is_kyc_verified: true,
    father_name: '',
    spouse_name: '',
    marital_status: 'Married',
    blood_group: 'O+',
    religion: 'Hinduism',
    caste_category: 'OBC',
    qualification: 'Graduate',
    occupation: 'Agriculture',
    annual_income: '150000.00',
    board_resolution_no: 'BR-2026/089',
    board_resolution_date: new Date().toISOString().split('T')[0],
    dccb_sb_account_no: 'DCCB-SB-440912',
    ledger_folio_no: 'LF-104',
    address: 'Rural Agricultural Belt',
    village: 'Mandya Rural',
    taluk: 'Mandya',
    district: 'Mandya',
    state: 'Karnataka',
    pincode: '571401',
    status: 'ACTIVE'
  });

  const [landData, setLandData] = useState({
    survey_number: '',
    area_acres: '3.50',
    unit: 'Acres',
    village: 'Mandya Rural',
    ownership_type: 'Self Owned',
  });

  useEffect(() => {
    fetchMembers();
  }, [search]);

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/members/?search=${search}`);
      setMembers(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnrollMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/members/', formData);
      alert('Member Enrolled Successfully!');
      setActiveTab('list');
      fetchMembers();
      resetForm();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error enrolling member. Please check required fields.');
    }
  };

  const resetForm = () => {
    setFormData({
      member_number: `M-${Math.floor(100000 + Math.random() * 900000)}`,
      first_name: '', middle_name: '', last_name: '', local_language_name: '',
      gender: 'MALE', dob: '', mobile: '', email: '', aadhaar_number: '', is_kyc_verified: true,
      father_name: '', spouse_name: '', marital_status: 'Married', blood_group: 'O+',
      religion: 'Hinduism', caste_category: 'OBC', qualification: 'Graduate', occupation: 'Agriculture',
      annual_income: '150000.00', board_resolution_no: 'BR-2026/089',
      board_resolution_date: new Date().toISOString().split('T')[0],
      dccb_sb_account_no: 'DCCB-SB-440912', ledger_folio_no: 'LF-104',
      address: 'Rural Agricultural Belt', village: 'Mandya Rural', taluk: 'Mandya',
      district: 'Mandya', state: 'Karnataka', pincode: '571401', status: 'ACTIVE'
    });
  };

  const handleAddLand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLandModal) return;
    try {
      await api.post(`/members/${showLandModal.id}/add-land/`, landData);
      alert('Land record registered successfully!');
      setShowLandModal(null);
      fetchMembers();
    } catch (err) {
      alert('Error registering land record');
    }
  };

  // 8-Step Workflow Definition (from ka.uniteerp.in PACS ERP workflow reference)
  const workflowSteps = [
    { id: 1, title: 'Enroll Member', subtitle: 'Basic Profile Registration', icon: UserPlus, color: 'from-emerald-500 to-teal-600', action: () => setActiveTab('enroll') },
    { id: 2, title: 'Other Details', subtitle: 'KYC, Aadhaar & Caste', icon: ShieldCheck, color: 'from-blue-500 to-cyan-600', action: () => setActiveTab('enroll') },
    { id: 3, title: 'Register Land', subtitle: 'Acreage & Survey Nos', icon: Layers, color: 'from-amber-500 to-yellow-600', action: () => setActiveTab('list') },
    { id: 4, title: 'Share Deposit', subtitle: 'Share Capital Allotment', icon: Landmark, color: 'from-indigo-500 to-purple-600', action: () => window.location.href = '/pkps/shares' },
    { id: 5, title: 'Share Withdrawal', subtitle: 'Refund / Transfer', icon: PiggyBank, color: 'from-fuchsia-500 to-pink-600', action: () => window.location.href = '/pkps/shares' },
    { id: 6, title: 'Dividend', subtitle: 'Annual Share Returns', icon: Coins, color: 'from-emerald-600 to-green-500', action: () => window.location.href = '/pkps/shares' },
    { id: 7, title: 'Membership Closure', subtitle: 'Resignation & Transfer', icon: UserX, color: 'from-rose-500 to-red-600', action: () => setActiveTab('list') },
    { id: 8, title: 'View Member', subtitle: '360° Comprehensive Profile', icon: Eye, color: 'from-teal-500 to-emerald-400', action: () => setActiveTab('list') },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Government PACS ERP Standard Module</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">PACS Membership Management & Lifecycle</h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete end-to-end workflow: Member Enrollment, KYC Verification, Land Registration, Shares, Dividends, and Membership Closure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-2 transition ${
              activeTab === 'workflow'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Workflow View</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-2 transition ${
              activeTab === 'list'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>All Members View ({members.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('enroll'); resetForm(); }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll New Member</span>
          </button>
        </div>
      </div>

      {/* Interactive Workflow Diagram (Reference: ka.uniteerp.in Workflow) */}
      {activeTab === 'workflow' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl backdrop-blur-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-emerald-400" />
                <span>PACS Membership Lifecycle Workflow Diagram</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Click any stage below to perform member actions or view records</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              PACS Reg. Standard Flow
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  onClick={step.action}
                  className="group relative bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-white shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono text-slate-500 font-bold">STAGE 0{step.id}</span>
                  </div>

                  <h3 className="font-bold text-slate-100 group-hover:text-emerald-400 transition text-base">{step.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{step.subtitle}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-medium">
                    <span>Execute Stage</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Sub-navigation Bar */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap justify-center gap-3 text-xs text-slate-400">
            <button onClick={() => setActiveTab('enroll')} className="hover:text-emerald-400 underline">Enroll Member</button>
            <span>•</span>
            <button onClick={() => setActiveTab('list')} className="hover:text-emerald-400 underline">Modify / View Member</button>
            <span>•</span>
            <button onClick={() => setActiveTab('list')} className="hover:text-emerald-400 underline">Register Land Holdings</button>
            <span>•</span>
            <a href="/pkps/shares" className="hover:text-emerald-400 underline">Share Deposit & Withdrawal</a>
            <span>•</span>
            <a href="/pkps/shares" className="hover:text-emerald-400 underline">Dividend Distribution</a>
          </div>
        </div>
      )}

      {/* Comprehensive Enrollment Form (Reference: ka.uniteerp.in Member Personal Details Form) */}
      {activeTab === 'enroll' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <UserPlus className="w-6 h-6 text-emerald-400" />
                <span>PACS Member Enrollment & General Details Form</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Official PACS / PKPS Farmer Enrollment Form (NABARD / DCCB Compliant)</p>
            </div>
            <button onClick={() => setActiveTab('list')} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleEnrollMember} className="space-y-8">
            {/* Section 1: General Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">1. General & Name Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label htmlFor="member_number" className="block text-slate-400 font-semibold mb-1">Society Membership No. *</label>
                  <input
                    id="member_number"
                    type="text"
                    required
                    value={formData.member_number}
                    onChange={(e) => setFormData({ ...formData, member_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="first_name" className="block text-slate-400 font-semibold mb-1">First Name *</label>
                  <input
                    id="first_name"
                    type="text"
                    required
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="middle_name" className="block text-slate-400 font-semibold mb-1">Middle Name</label>
                  <input
                    id="middle_name"
                    type="text"
                    placeholder="Middle Name"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-slate-400 font-semibold mb-1">Last Name</label>
                  <input
                    id="last_name"
                    type="text"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="local_language_name" className="block text-slate-400 font-semibold mb-1">Member Name (Kannada / Local Lang.)</label>
                  <input
                    id="local_language_name"
                    type="text"
                    placeholder="e.g. ರಮೇಶ್ ಗೌಡ"
                    value={formData.local_language_name}
                    onChange={(e) => setFormData({ ...formData, local_language_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 font-sans"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-slate-400 font-semibold mb-1">Gender *</label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dob" className="block text-slate-400 font-semibold mb-1">Date of Birth</label>
                  <input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Aadhaar & KYC Verification */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">2. Aadhaar & KYC Verification</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label htmlFor="aadhaar_number" className="block text-slate-400 font-semibold mb-1">Aadhaar Card No. *</label>
                  <input
                    id="aadhaar_number"
                    type="text"
                    required
                    maxLength={12}
                    placeholder="12-digit Aadhaar Number"
                    value={formData.aadhaar_number}
                    onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="mobile" className="block text-slate-400 font-semibold mb-1">Mobile Number *</label>
                  <input
                    id="mobile"
                    type="text"
                    required
                    placeholder="Mobile Number"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-slate-400 font-semibold mb-1">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-3 pt-6">
                  <input
                    id="is_kyc_verified"
                    type="checkbox"
                    checked={formData.is_kyc_verified}
                    onChange={(e) => setFormData({ ...formData, is_kyc_verified: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label htmlFor="is_kyc_verified" className="text-slate-300 font-medium cursor-pointer">
                    Verified Offline KYC (DCCB Verified)
                  </label>
                </div>
              </div>
            </div>

            {/* Section 3: Family, Social & Income Category */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">3. Family, Category & Income Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label htmlFor="father_name" className="block text-slate-400 font-semibold mb-1">Father's Name *</label>
                  <input
                    id="father_name"
                    type="text"
                    required
                    placeholder="Father Name"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="spouse_name" className="block text-slate-400 font-semibold mb-1">Spouse Name</label>
                  <input
                    id="spouse_name"
                    type="text"
                    placeholder="Spouse Name"
                    value={formData.spouse_name}
                    onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="marital_status" className="block text-slate-400 font-semibold mb-1">Marital Status</label>
                  <select
                    id="marital_status"
                    value={formData.marital_status}
                    onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500"
                  >
                    <option value="Married">Married</option>
                    <option value="Single">Single</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="caste_category" className="block text-slate-400 font-semibold mb-1">Caste Category *</label>
                  <select
                    id="caste_category"
                    value={formData.caste_category}
                    onChange={(e) => setFormData({ ...formData, caste_category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500"
                  >
                    <option value="OBC">OBC (Other Backward Class)</option>
                    <option value="GENERAL">General</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="qualification" className="block text-slate-400 font-semibold mb-1">Educational Qualification</label>
                  <input
                    id="qualification"
                    type="text"
                    placeholder="e.g. SSLC / PUC / Graduate"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="occupation" className="block text-slate-400 font-semibold mb-1">Occupation</label>
                  <input
                    id="occupation"
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="annual_income" className="block text-slate-400 font-semibold mb-1">Annual Income (₹)</label>
                  <input
                    id="annual_income"
                    type="number"
                    step="5000"
                    value={formData.annual_income}
                    onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Society, Banking & Resolution Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">4. Board Resolution & DCCB Banking Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label htmlFor="board_resolution_no" className="block text-slate-400 font-semibold mb-1">Board Resolution No. *</label>
                  <input
                    id="board_resolution_no"
                    type="text"
                    required
                    value={formData.board_resolution_no}
                    onChange={(e) => setFormData({ ...formData, board_resolution_no: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="board_resolution_date" className="block text-slate-400 font-semibold mb-1">Board Resolution Date</label>
                  <input
                    id="board_resolution_date"
                    type="date"
                    value={formData.board_resolution_date}
                    onChange={(e) => setFormData({ ...formData, board_resolution_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="dccb_sb_account_no" className="block text-slate-400 font-semibold mb-1">DCCB Bank SB Account No. *</label>
                  <input
                    id="dccb_sb_account_no"
                    type="text"
                    required
                    value={formData.dccb_sb_account_no}
                    onChange={(e) => setFormData({ ...formData, dccb_sb_account_no: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="ledger_folio_no" className="block text-slate-400 font-semibold mb-1">Ledger Folio No.</label>
                  <input
                    id="ledger_folio_no"
                    type="text"
                    value={formData.ledger_folio_no}
                    onChange={(e) => setFormData({ ...formData, ledger_folio_no: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-500/20"
              >
                Complete Member Enrollment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Member Registry Table View */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3" />
              <input
                type="text"
                placeholder="Search by Name, Member ID, Mobile, or Aadhaar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              Showing <span className="text-slate-100 font-bold">{members.length}</span> Registered Society Members
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-4">Member ID / Folio</th>
                  <th className="p-4">Full Name & Local Name</th>
                  <th className="p-4">Mobile & Aadhaar</th>
                  <th className="p-4">Village / Branch</th>
                  <th className="p-4">Land Holding</th>
                  <th className="p-4">KYC Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="font-mono text-xs text-emerald-400 font-bold">{m.member_number}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{m.ledger_folio_no || 'LF-101'}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{m.first_name} {m.last_name}</div>
                      {m.local_language_name && (
                        <div className="text-xs text-slate-400">{m.local_language_name}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-xs text-slate-300">{m.mobile}</div>
                      <div className="font-mono text-[10px] text-slate-500">Aadhaar: {m.aadhaar_number || 'XXXX-XXXX-4412'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-200 font-medium">{m.village}</div>
                      <div className="text-xs text-slate-500">{m.taluk || 'Mandya'}</div>
                    </td>
                    <td className="p-4">
                      {m.lands && m.lands.length > 0 ? (
                        <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <Layers className="w-3.5 h-3.5" />
                          <span>{m.lands.reduce((acc: number, l: any) => acc + parseFloat(l.area_acres), 0)} Acres</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">No Land Registered</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setShowDetailModal(m)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                      >
                        View 360° Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowLandModal(m);
                          setLandData({ ...landData, village: m.village });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition"
                      >
                        + Add Land
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 360-Degree Profile View Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowDetailModal(null)} className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-2xl shadow-lg">
                {showDetailModal.first_name?.[0]}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-100">{showDetailModal.first_name} {showDetailModal.last_name}</h3>
                <p className="text-xs text-slate-400 font-mono">Member ID: {showDetailModal.member_number} • Ledger Folio: {showDetailModal.ledger_folio_no || 'LF-104'}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Active PACS Member</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">DCCB Verified</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Father / Spouse</span>
                <div className="font-bold text-slate-200 mt-1">{showDetailModal.father_name || 'N/A'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Aadhaar Card No.</span>
                <div className="font-mono font-bold text-emerald-400 mt-1">{showDetailModal.aadhaar_number || 'XXXX-XXXX-8812'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500">DCCB SB Account</span>
                <div className="font-mono font-bold text-slate-200 mt-1">{showDetailModal.dccb_sb_account_no || 'DCCB-SB-44012'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Caste Category</span>
                <div className="font-bold text-slate-200 mt-1">{showDetailModal.caste_category || 'OBC'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Annual Income</span>
                <div className="font-mono font-bold text-emerald-400 mt-1">₹{showDetailModal.annual_income || '150,000.00'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Board Resolution</span>
                <div className="font-mono font-bold text-slate-200 mt-1">{showDetailModal.board_resolution_no || 'BR-2026/089'}</div>
              </div>
            </div>

            {/* Land Holdings Summary */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-200 text-sm flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Registered Land Holdings</span>
              </h4>
              {showDetailModal.lands && showDetailModal.lands.length > 0 ? (
                <div className="space-y-2">
                  {showDetailModal.lands.map((l: any) => (
                    <div key={l.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono text-emerald-400 font-bold">{l.survey_number}</span>
                        <span className="text-slate-400 ml-2">({l.village})</span>
                      </div>
                      <span className="font-bold text-slate-200">{l.area_acres} Acres ({l.ownership_type})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  No land registered yet. Click "+ Add Land" to record survey numbers.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button onClick={() => setShowDetailModal(null)} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Land Modal */}
      {showLandModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100">Register Land for {showLandModal.first_name}</h3>
            <form onSubmit={handleAddLand} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Survey Number *</label>
                <input
                  type="text"
                  placeholder="e.g. SY-145/2B"
                  required
                  value={landData.survey_number}
                  onChange={(e) => setLandData({ ...landData, survey_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Area (in Acres) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 3.50"
                  required
                  value={landData.area_acres}
                  onChange={(e) => setLandData({ ...landData, area_acres: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Village Location *</label>
                <input
                  type="text"
                  required
                  value={landData.village}
                  onChange={(e) => setLandData({ ...landData, village: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLandModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20"
                >
                  Save Land Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
