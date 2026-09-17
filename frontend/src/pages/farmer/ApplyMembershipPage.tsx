import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Tenant } from '../../types';
import { Building2, FileText, Upload, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

export const ApplyMembershipPage: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  const [formData, setFormData] = useState({
    tenant_id: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    father_name: '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    aadhaar_number: '',
    gender: 'MALE',
    dob: '',
    address: '',
    village: '',
    taluk: '',
    district: '',
    state: 'Karnataka',
    pincode: '',
    land_survey_number: '',
    land_area_acres: '',
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
      setError('Please upload your Utara (Land Record) document.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('tenant', formData.tenant_id);
      payload.append('first_name', formData.first_name);
      payload.append('last_name', formData.last_name);
      payload.append('father_name', formData.father_name);
      payload.append('mobile', formData.mobile);
      payload.append('email', formData.email);
      payload.append('aadhaar_number', formData.aadhaar_number);
      payload.append('gender', formData.gender);
      if (formData.dob) payload.append('dob', formData.dob);
      payload.append('address', formData.address);
      payload.append('village', formData.village);
      payload.append('taluk', formData.taluk);
      payload.append('district', formData.district);
      payload.append('state', formData.state);
      payload.append('pincode', formData.pincode);
      payload.append('land_survey_number', formData.land_survey_number);
      if (formData.land_area_acres) payload.append('land_area_acres', formData.land_area_acres);
      
      payload.append('utara_document', utaraFile);

      await api.post('/members/applications/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg('Membership Application & Utara Document submitted successfully! PKPS Administrator will verify it soon.');
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
        <h2 className="text-2xl font-bold text-slate-100">Application Submitted!</h2>
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
            Membership Application Form
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-2">
            Apply to Become a PKPS Society Member
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200">
            Fill in your personal, land details, and upload your official **Utara (Land Record) Document** for verification by society admin.
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
        
        {/* Step 1: Select PKPS Society */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-100">Select PKPS Society</h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Choose Target Society (Primary Agricultural Credit Co-op Society) *
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
                    {t.name} ({t.village}, {t.district}) - {t.code}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Step 2: Personal & KYC Details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-100">Personal & KYC Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="block text-xs font-bold text-slate-300 mb-1">Father / Spouse Name</label>
              <input
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleTextChange}
                placeholder="Father's full name"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Number *</label>
              <input
                type="text"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Aadhaar Card Number *</label>
              <input
                type="text"
                name="aadhaar_number"
                required
                placeholder="12-digit Aadhaar Number"
                value={formData.aadhaar_number}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Gender</label>
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
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Village *</label>
              <input
                type="text"
                name="village"
                required
                value={formData.village}
                onChange={handleTextChange}
                placeholder="Village name"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Land Record & Utara Document Upload */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-100">Land Record & Utara Document Upload</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Land Survey / Sy. No. *</label>
              <input
                type="text"
                name="land_survey_number"
                required
                placeholder="e.g. Sy. No. 142/2A"
                value={formData.land_survey_number}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Land Area (Acres) *</label>
              <input
                type="number"
                step="0.01"
                name="land_area_acres"
                required
                placeholder="e.g. 3.50"
                value={formData.land_area_acres}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Utara Document File Upload Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Upload Utara Document (Land RTC / Pahani Copy) *
            </label>
            <div className="p-6 border-2 border-dashed border-emerald-500/40 rounded-2xl bg-slate-950/60 hover:bg-slate-950 transition text-center relative group cursor-pointer">
              <input
                type="file"
                required
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>
                {utaraFile ? (
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-emerald-300 block">{utaraFile.name}</span>
                    <span className="text-xs text-slate-400">({(utaraFile.size / 1024).toFixed(1)} KB) - Click to replace</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Click or Drag & Drop Utara File</p>
                    <p className="text-xs text-slate-500 mt-1">Supports PDF, JPG, PNG files (Max 10MB)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 flex items-center justify-end space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? 'Submitting Application...' : 'Submit Application & Utara Document'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </form>
    </div>
  );
};
