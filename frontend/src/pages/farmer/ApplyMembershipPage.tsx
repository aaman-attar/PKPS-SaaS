import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Tenant } from '../../types';
import { 
  Building2, FileText, Upload, CheckCircle2, ShieldCheck, 
  ArrowRight, ArrowLeft, AlertCircle, Layers, User, MapPin, 
  Landmark, Sparkles
} from 'lucide-react';

export const ApplyMembershipPage: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  const [formData, setFormData] = useState({
    tenant_id: '',
    // Personal Details
    first_name: user?.first_name || '',
    middle_name: '',
    last_name: user?.last_name || '',
    local_language_name: '',
    gender: 'MALE',
    dob: '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    aadhaar_number: '',

    // KYC, Family & Socio-Economic
    father_name: '',
    spouse_name: '',
    marital_status: 'Married',
    blood_group: '',
    religion: 'Hindu',
    caste_category: 'OBC',
    qualification: 'SSLC',
    occupation: 'Agriculture',
    annual_income: '150000.00',

    // Address Details
    address: '',
    village: '',
    taluk: '',
    district: '',
    state: 'Karnataka',
    pincode: '',

    // Banking Details
    dccb_sb_account_no: '',

    // Land Details
    land_survey_number: '',
    land_area_acres: '',
    land_unit: 'Acres',
    land_rtc_no: '',
    land_ownership_type: 'Self Owned',
    land_crop_type: 'Paddy / Sugarcane',
    land_irrigation_type: 'Canal / Borewell',
  });

  const [utaraFile, setUtaraFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants/public/');
      const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setTenants(list);
      if (list.length > 0) {
        setFormData(prev => ({ ...prev, tenant_id: list[0].id }));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch available societies list.');
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUtaraFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenant_id) {
      setError('Please select a PKPS society to apply.');
      return;
    }
    if (!utaraFile) {
      setError('Please upload your official Utara (Land Record / RTC) document.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('tenant', formData.tenant_id);
      payload.append('first_name', formData.first_name);
      payload.append('middle_name', formData.middle_name);
      payload.append('last_name', formData.last_name);
      payload.append('local_language_name', formData.local_language_name);
      payload.append('gender', formData.gender);
      if (formData.dob) payload.append('dob', formData.dob);
      payload.append('mobile', formData.mobile);
      payload.append('email', formData.email);
      payload.append('aadhaar_number', formData.aadhaar_number);

      payload.append('father_name', formData.father_name);
      payload.append('spouse_name', formData.spouse_name);
      payload.append('marital_status', formData.marital_status);
      payload.append('blood_group', formData.blood_group);
      payload.append('religion', formData.religion);
      payload.append('caste_category', formData.caste_category);
      payload.append('qualification', formData.qualification);
      payload.append('occupation', formData.occupation);
      payload.append('annual_income', formData.annual_income || '0.00');

      payload.append('address', formData.address);
      payload.append('village', formData.village);
      payload.append('taluk', formData.taluk);
      payload.append('district', formData.district);
      payload.append('state', formData.state);
      payload.append('pincode', formData.pincode);

      payload.append('dccb_sb_account_no', formData.dccb_sb_account_no);

      payload.append('land_survey_number', formData.land_survey_number);
      if (formData.land_area_acres) payload.append('land_area_acres', formData.land_area_acres);
      payload.append('land_unit', formData.land_unit);
      payload.append('land_rtc_no', formData.land_rtc_no);
      payload.append('land_ownership_type', formData.land_ownership_type);
      payload.append('land_crop_type', formData.land_crop_type);
      payload.append('land_irrigation_type', formData.land_irrigation_type);

      payload.append('utara_document', utaraFile);

      await api.post('/members/applications/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg('Membership Application & Land Record submitted successfully! The PKPS Society Administrator will review your details, verify the Utara, and issue your official Member Number.');
      if (onComplete) onComplete();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data) {
        const d = err.response.data;
        const msg = typeof d === 'object' ? Object.keys(d).map(k => `${k}: ${d[k]}`).join(' | ') : 'Submission failed.';
        setError(msg);
      } else {
        setError('Failed to submit application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (successMsg) {
    return (
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 max-w-2xl mx-auto text-center space-y-6 my-8 shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Application Submitted Successfully!</h2>
        <p className="text-slate-300 text-sm leading-relaxed">{successMsg}</p>
        <button
          onClick={() => {
            if (onComplete) onComplete();
            else navigate('/farmer/dashboard');
          }}
          className="py-3 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition cursor-pointer"
        >
          View Application Status on Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-600/40 shadow-xl space-y-2 relative overflow-hidden">
        <div className="relative z-10">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
            Co-operative Society Membership Form (ಸದಸ್ಯತ್ವ ಅರ್ಜಿ)
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-2">
            Apply to Become a PKPS Society Member
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200">
            Submit your complete personal, socio-economic, land details, and upload your official **Utara (RTC Land Record)** for society verification.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
        
        {/* Section 1: Select PKPS Society */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span>Select PKPS Society (PACS)</span>
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Choose Target Society *
            </label>
            {loadingTenants ? (
              <div className="text-xs text-slate-400 py-2">Loading societies list...</div>
            ) : (
              <select
                name="tenant_id"
                required
                value={formData.tenant_id}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-medium text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.village || t.district}) - {t.code}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Section 2: Personal Details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-400" />
              <span>Personal & Name Details</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Middle Name</label>
              <input
                type="text"
                name="middle_name"
                placeholder="Middle Name"
                value={formData.middle_name}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Name in Local Language (Kannada)</label>
              <input
                type="text"
                name="local_language_name"
                placeholder="e.g. ರಮೇಶ್ ಗೌಡ"
                value={formData.local_language_name}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Number *</label>
              <input
                type="text"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Aadhaar Card Number *</label>
              <input
                type="text"
                name="aadhaar_number"
                required
                maxLength={12}
                placeholder="12-digit Aadhaar Number"
                value={formData.aadhaar_number}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="farmer@example.com"
                value={formData.email}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Family, Social & Income */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Family, Category & Socio-Economic Details</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Father's Name *</label>
              <input
                type="text"
                name="father_name"
                required
                placeholder="Father's full name"
                value={formData.father_name}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Spouse Name</label>
              <input
                type="text"
                name="spouse_name"
                placeholder="Spouse Name (if married)"
                value={formData.spouse_name}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Marital Status</label>
              <select
                name="marital_status"
                value={formData.marital_status}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="Married">Married</option>
                <option value="Single">Single</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Caste Category *</label>
              <select
                name="caste_category"
                value={formData.caste_category}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="OBC">OBC (Other Backward Class)</option>
                <option value="GENERAL">General</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Religion</label>
              <input
                type="text"
                name="religion"
                value={formData.religion}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Blood Group</label>
              <input
                type="text"
                name="blood_group"
                placeholder="e.g. O+, B+, A+"
                value={formData.blood_group}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Educational Qualification</label>
              <input
                type="text"
                name="qualification"
                placeholder="e.g. SSLC / PUC / Graduate"
                value={formData.qualification}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Occupation</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Annual Income (₹)</label>
              <input
                type="number"
                step="5000"
                name="annual_income"
                value={formData.annual_income}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Residential Address */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-teal-400" />
              <span>Residential Address</span>
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Street / House Address *</label>
            <textarea
              name="address"
              required
              rows={2}
              placeholder="Door No, Street Name, Landmark"
              value={formData.address}
              onChange={handleTextChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Village / Town *</label>
              <input
                type="text"
                name="village"
                required
                value={formData.village}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Taluk</label>
              <input
                type="text"
                name="taluk"
                value={formData.taluk}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">District *</label>
              <input
                type="text"
                name="district"
                required
                value={formData.district}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">PIN Code *</label>
              <input
                type="text"
                name="pincode"
                required
                maxLength={6}
                value={formData.pincode}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Land Holdings & Official RTC Utara Upload */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              5
            </div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Agricultural Land Holdings & Official RTC / Utara Document</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Survey Number *</label>
              <input
                type="text"
                name="land_survey_number"
                required
                placeholder="e.g. 142/2A"
                value={formData.land_survey_number}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Land Area *</label>
              <input
                type="number"
                step="0.01"
                name="land_area_acres"
                required
                placeholder="e.g. 3.50"
                value={formData.land_area_acres}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Unit</label>
              <select
                name="land_unit"
                value={formData.land_unit}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="Acres">Acres</option>
                <option value="Guntas">Guntas</option>
                <option value="Hectares">Hectares</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">RTC / Utara No.</label>
              <input
                type="text"
                name="land_rtc_no"
                placeholder="RTC number"
                value={formData.land_rtc_no}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Ownership Type</label>
              <select
                name="land_ownership_type"
                value={formData.land_ownership_type}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="Self Owned">Self Owned</option>
                <option value="Ancestral">Ancestral (Family)</option>
                <option value="Joint Ownership">Joint Ownership</option>
                <option value="Leased">Leased / Tenant Farmer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Crops Cultivated</label>
              <input
                type="text"
                name="land_crop_type"
                placeholder="e.g. Paddy, Ragi, Sugarcane"
                value={formData.land_crop_type}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Irrigation Source</label>
              <input
                type="text"
                name="land_irrigation_type"
                placeholder="e.g. Canal / Borewell / Rainfed"
                value={formData.land_irrigation_type}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Utara File Upload Card */}
          <div className="bg-slate-950/80 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-2xl p-6 text-center transition">
            <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-200">
              Upload Official Land RTC / Utara Document *
            </h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Accepted formats: PDF, JPG, PNG (Max 10MB). Society Admin verifies this before approving membership.
            </p>

            <input
              type="file"
              required
              id="utara-upload"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="utara-upload"
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer inline-flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{utaraFile ? utaraFile.name : 'Select Utara Document File'}</span>
            </label>
            {utaraFile && (
              <p className="text-xs text-emerald-400 mt-2 font-mono">
                Selected: {utaraFile.name} ({(utaraFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        {/* Section 6: Existing DCCB Bank Account (Optional) */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              6
            </div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Landmark className="w-5 h-5 text-indigo-400" />
              <span>DCCB / Bank Account (Optional)</span>
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Existing DCCB Savings Bank (SB) Account Number
            </label>
            <input
              type="text"
              name="dccb_sb_account_no"
              placeholder="Enter DCCB SB account number if already held"
              value={formData.dccb_sb_account_no}
              onChange={handleTextChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              If left blank, the society will assign or open a cooperative savings folio upon membership approval.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="py-3 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
          >
            {submitting ? (
              <span>Submitting Application...</span>
            ) : (
              <>
                <span>Submit Membership Application (ಅರ್ಜಿ ಸಲ್ಲಿಸಿ)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
