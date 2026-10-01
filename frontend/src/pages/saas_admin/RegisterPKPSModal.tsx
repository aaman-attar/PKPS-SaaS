import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  X, CheckCircle2, ChevronRight, ChevronLeft, Building2,
  MapPin, Landmark, UserCheck, ShieldAlert, Copy, ExternalLink,
  Sparkles, Layers, FileText, Check, AlertCircle, RefreshCw
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterPKPSModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Success state from backend
  const [successData, setSuccessData] = useState<{
    message: string;
    tenant: any;
    invitation: any;
    dev_activation_link?: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic
    name: '',
    code: '',
    society_type: 'PACS',
    subscription_plan: 'STANDARD',

    // Step 2: Registration
    registration_number: '',
    registration_date: '',
    registration_authority: 'Registrar of Cooperative Societies',
    society_category: 'GENERAL',
    area_of_operation: 'TALUK',
    operation_villages: '',
    pan: '',
    certificate_number: '',

    // Step 3: Address
    address_line_1: '',
    address_line_2: '',
    village_town: '',
    gram_panchayat: '',
    address_taluk: '',
    address_district: '',
    address_state: 'Karnataka',
    pin_code: '',
    official_mobile: '',
    official_email: '',

    // Step 4: Banking
    bank_type: 'DCCB',
    bank_name: '',
    branch_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'CURRENT',
    dccb_customer_id: '',

    // Step 5: Authorized Person (Chief Promoter / President)
    auth_full_name: '',
    auth_designation: 'President / Chief Promoter',
    auth_mobile: '',
    auth_email: '',
    auth_id_type: 'AADHAAR',
    auth_id_number: '',

    // Step 6: Initial PKPS Admin Account Provisioning
    admin_full_name: '',
    admin_designation: 'Chief Executive Officer (CEO)',
    admin_mobile: '',
    admin_email: '',
  });

  if (!isOpen) return null;

  // Auto-generate code suggestion
  const generateCodeSuggestion = () => {
    const dist = (formData.address_district || 'KAR').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
    const randNum = Math.floor(100 + Math.random() * 900);
    const suggested = `PKPS-${dist || 'SOCIETY'}-${randNum}`;
    setFormData((prev) => ({ ...prev, code: suggested }));
  };

  const handleNext = () => {
    setErrorMsg(null);
    // Simple per-step validations
    if (step === 1) {
      if (!formData.name.trim()) return setErrorMsg('Please enter the Society Name.');
      if (!formData.code.trim()) return setErrorMsg('Please enter or generate a Tenant Code.');
    } else if (step === 2) {
      if (!formData.registration_number.trim()) return setErrorMsg('Please enter Registration Number.');
    } else if (step === 3) {
      if (!formData.address_line_1.trim()) return setErrorMsg('Please enter Address Line 1.');
      if (!formData.village_town.trim()) return setErrorMsg('Please enter Village / Town.');
      if (!formData.address_district.trim()) return setErrorMsg('Please enter District.');
      if (!formData.pin_code.trim()) return setErrorMsg('Please enter PIN Code.');
    } else if (step === 4) {
      if (!formData.bank_name.trim()) return setErrorMsg('Please enter Primary DCCB / Bank Name.');
      if (!formData.account_number.trim()) return setErrorMsg('Please enter Bank Account Number.');
    } else if (step === 6) {
      if (!formData.admin_full_name.trim()) return setErrorMsg('Please enter PKPS Administrator Full Name.');
      if (!formData.admin_email.trim()) return setErrorMsg('Please enter Administrator Email Address.');
      if (!formData.admin_mobile.trim()) return setErrorMsg('Please enter Administrator Mobile Number.');
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const payload: any = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        society_type: formData.society_type,
        subscription_plan: formData.subscription_plan,

        registration_number: formData.registration_number.trim(),
        registration_date: formData.registration_date || null,
        registration_authority: formData.registration_authority,
        state: formData.address_state,
        district: formData.address_district,
        taluk: formData.address_taluk,
        society_category: formData.society_category,
        area_of_operation: formData.area_of_operation,
        operation_villages: formData.operation_villages
          ? formData.operation_villages.split(',').map((v) => v.trim()).filter(Boolean)
          : [],
        pan: formData.pan.trim().toUpperCase(),
        certificate_number: formData.certificate_number.trim(),

        address_line_1: formData.address_line_1.trim(),
        address_line_2: formData.address_line_2.trim(),
        village_town: formData.village_town.trim(),
        gram_panchayat: formData.gram_panchayat.trim(),
        address_taluk: formData.address_taluk.trim(),
        address_district: formData.address_district.trim(),
        address_state: formData.address_state,
        pin_code: formData.pin_code.trim(),
        official_mobile: formData.official_mobile.trim(),
        official_email: formData.official_email.trim() || undefined,

        bank_accounts: [
          {
            bank_type: formData.bank_type,
            bank_name: formData.bank_name.trim(),
            branch_name: formData.branch_name.trim(),
            account_number: formData.account_number.trim(),
            ifsc_code: formData.ifsc_code.trim().toUpperCase(),
            account_type: formData.account_type,
            account_holder_name: formData.name.trim(),
            dccb_customer_id: formData.dccb_customer_id.trim(),
            is_primary: true,
          },
        ],

        auth_full_name: formData.auth_full_name.trim(),
        auth_designation: formData.auth_designation.trim(),
        auth_mobile: formData.auth_mobile.trim(),
        auth_email: formData.auth_email.trim() || undefined,
        auth_id_type: formData.auth_id_type,
        auth_id_number: formData.auth_id_number.trim(),

        admin_full_name: formData.admin_full_name.trim(),
        admin_designation: formData.admin_designation.trim(),
        admin_mobile: formData.admin_mobile.trim(),
        admin_email: formData.admin_email.trim(),
      };

      const res = await api.post('/tenants/onboard/', payload);
      setSuccessData(res.data);
      onSuccess();
    } catch (err: any) {
      console.error('Onboarding failed:', err);
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'object') {
          const msgs = Object.entries(d).map(([k, v]: [string, any]) =>
            `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
          );
          setErrorMsg(msgs.join(' | '));
        } else {
          setErrorMsg(String(d));
        }
      } else {
        setErrorMsg(err.message || 'Failed to onboard society.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const stepsList = [
    { num: 1, label: 'Society Info' },
    { num: 2, label: 'Registration' },
    { num: 3, label: 'Address' },
    { num: 4, label: 'Banking' },
    { num: 5, label: 'Authorized' },
    { num: 6, label: 'PKPS Admin' },
    { num: 7, label: 'Review' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Register New PKPS Society</h2>
              <p className="text-xs text-slate-400">
                Multi-step Tenant & Administrator Provisioning Wizard
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

        {/* Progress Bar (hidden on success) */}
        {!successData && (
          <div className="px-6 py-3 bg-slate-950/20 border-b border-slate-800/40">
            <div className="flex items-center justify-between">
              {stepsList.map((s, idx) => (
                <React.Fragment key={s.num}>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        step === s.num
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                          : step > s.num
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <span
                      className={`text-xs hidden md:inline font-medium ${
                        step === s.num ? 'text-blue-400' : step > s.num ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < stepsList.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 rounded ${
                        step > s.num ? 'bg-emerald-500/40' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Screen */}
          {successData ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">PKPS Society Onboarded Successfully!</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Tenant <span className="font-semibold text-emerald-400">{successData.tenant.name}</span> has been provisioned.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 text-left text-xs space-y-3">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block">Tenant Code:</span>
                    <span className="font-mono font-bold text-blue-400 text-sm">{successData.tenant.code}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tenant Status:</span>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {successData.tenant.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">PKPS Admin Email:</span>
                    <span className="font-medium text-slate-200">{formData.admin_email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Admin Username:</span>
                    <span className="font-mono font-medium text-cyan-400">
                      {successData.tenant.admin_user?.username || `${formData.code.toLowerCase()}-admin`}
                    </span>
                  </div>
                </div>

                {/* Activation Link Box */}
                {successData.dev_activation_link && (
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>PKPS Administrator Invitation Link:</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Valid for 24 hours</span>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-900 border border-emerald-500/30 rounded-xl p-2.5">
                      <input
                        type="text"
                        readOnly
                        value={successData.dev_activation_link}
                        className="bg-transparent text-emerald-300 font-mono text-xs w-full focus:outline-none select-all"
                      />
                      <button
                        onClick={() => copyToClipboard(successData.dev_activation_link!)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1 flex-shrink-0 transition border border-emerald-500/30"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <a
                        href={successData.dev_activation_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 underline"
                      >
                        <span>Open Activation Page in New Tab</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Step 1 — Basic Society Information</h3>
                    <p className="text-xs text-slate-400">Enter organization name, unique code, and core classification.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Society Full Legal Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mandya Taluk Primary Agricultural Credit Co-Operative Society Ltd."
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-medium text-slate-300">
                            Tenant Code * (Unique)
                          </label>
                          <button
                            type="button"
                            onClick={generateCodeSuggestion}
                            className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Suggest Code</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. PKPS-MANDYA-001"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Society Type
                        </label>
                        <select
                          value={formData.society_type}
                          onChange={(e) => setFormData({ ...formData, society_type: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="PACS">PACS (Primary Agricultural Credit Society)</option>
                          <option value="FPO">FPO (Farmer Producer Organisation)</option>
                          <option value="DCCB">DCCB (District Central Co-Op Bank)</option>
                          <option value="URBAN_BANK">Urban Co-Operative Credit Society</option>
                          <option value="DAIRY">Dairy Co-Operative Society</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        SaaS Subscription Plan
                      </label>
                      <select
                        value={formData.subscription_plan}
                        onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="TRIAL">Free Trial (30 Days)</option>
                        <option value="BASIC">Basic Plan (Up to 500 Members)</option>
                        <option value="STANDARD">Standard PACS ERP (Up to 5,000 Members)</option>
                        <option value="ENTERPRISE">Enterprise (Unlimited Members & Multi-Branch)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Registration Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Step 2 — Legal Registration Details</h3>
                    <p className="text-xs text-slate-400">Cooperative Department registration information and PAN.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Registration Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. AR-32/RCS/2004"
                        value={formData.registration_number}
                        onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Registration Date
                      </label>
                      <input
                        type="date"
                        value={formData.registration_date}
                        onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Registration Authority
                      </label>
                      <input
                        type="text"
                        value={formData.registration_authority}
                        onChange={(e) => setFormData({ ...formData, registration_authority: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Society PAN Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. AAATP1234K"
                        maxLength={10}
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Area of Operation
                      </label>
                      <select
                        value={formData.area_of_operation}
                        onChange={(e) => setFormData({ ...formData, area_of_operation: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="VILLAGE">Single Village</option>
                        <option value="TALUK">Taluk Level</option>
                        <option value="DISTRICT">District Level</option>
                        <option value="STATE">State Level</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Operation Villages (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Doddabyranahalli, Kestur, Maddur"
                        value={formData.operation_villages}
                        onChange={(e) => setFormData({ ...formData, operation_villages: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Address & Location */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Step 3 — Registered Office Address</h3>
                    <p className="text-xs text-slate-400">Headquarters location and official society contact.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Main Road, Beside Post Office"
                        value={formData.address_line_1}
                        onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Village / Town *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Maddur"
                          value={formData.village_town}
                          onChange={(e) => setFormData({ ...formData, village_town: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Taluk
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Maddur Taluk"
                          value={formData.address_taluk}
                          onChange={(e) => setFormData({ ...formData, address_taluk: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          District *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Mandya"
                          value={formData.address_district}
                          onChange={(e) => setFormData({ ...formData, address_district: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.address_state}
                          onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 571428"
                          maxLength={6}
                          value={formData.pin_code}
                          onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Official Society Mobile
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 9845012345"
                          value={formData.official_mobile}
                          onChange={(e) => setFormData({ ...formData, official_mobile: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Banking & DCCB */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Step 4 — DCCB Affiliation & Bank Account</h3>
                    <p className="text-xs text-slate-400">Primary operating bank account linked for credit operations.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Bank Type
                      </label>
                      <select
                        value={formData.bank_type}
                        onChange={(e) => setFormData({ ...formData, bank_type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="DCCB">DCCB (District Central Co-operative Bank)</option>
                        <option value="COMMERCIAL">Commercial Bank (SBI, Canara, etc.)</option>
                        <option value="APEX">State Apex Co-operative Bank</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mandya District Central Co-op Bank Ltd."
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Maddur Main Branch"
                        value={formData.branch_name}
                        onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 102938475610"
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MDCC0001020"
                        value={formData.ifsc_code}
                        onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Account Type
                      </label>
                      <select
                        value={formData.account_type}
                        onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="CURRENT">Current Account</option>
                        <option value="CASH_CREDIT">Cash Credit (CC) Account</option>
                        <option value="SAVINGS">Savings Account</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Authorized Person */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Step 5 — Authorized Person / Chief Promoter</h3>
                    <p className="text-xs text-slate-400">Elected President or Chief Promoter legally responsible for the PACS.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Shivananda Gowda"
                        value={formData.auth_full_name}
                        onChange={(e) => setFormData({ ...formData, auth_full_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={formData.auth_designation}
                        onChange={(e) => setFormData({ ...formData, auth_designation: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9845099887"
                        value={formData.auth_mobile}
                        onChange={(e) => setFormData({ ...formData, auth_mobile: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        ID Number (Aadhaar / Voter ID)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1234 5678 9012"
                        value={formData.auth_id_number}
                        onChange={(e) => setFormData({ ...formData, auth_id_number: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Initial PKPS Admin Account Provisioning */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Step 6 — Provision Initial PKPS Administrator</h3>
                    <p className="text-xs text-slate-400">
                      This user will receive the invitation token to activate their society ERP portal.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center space-x-3 text-blue-300 text-xs">
                    <UserCheck className="w-5 h-5 flex-shrink-0 text-blue-400" />
                    <span>
                      An initial PKPS Administrator account will be automatically provisioned for this tenant with role <strong className="text-white">PKPS_ADMIN</strong>.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Admin Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.admin_full_name}
                        onChange={(e) => setFormData({ ...formData, admin_full_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Role / Designation
                      </label>
                      <input
                        type="text"
                        value={formData.admin_designation}
                        onChange={(e) => setFormData({ ...formData, admin_designation: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Official Admin Email * (Invitation Recipient)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. ramesh.ceo@mandyapkps.coop"
                        value={formData.admin_email}
                        onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Admin Mobile Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={formData.admin_mobile}
                        onChange={(e) => setFormData({ ...formData, admin_mobile: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-400">
                    <span className="block text-slate-500 text-[11px]">System Generated Username Preview:</span>
                    <span className="font-mono text-cyan-400 font-semibold">
                      {formData.code ? `${formData.code.toLowerCase()}-admin` : 'pkps-tenant-admin'}
                    </span>
                  </div>
                </div>
              )}

              {/* Step 7: Review & Confirm */}
              {step === 7 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Step 7 — Review & Submit Onboarding</h3>
                    <p className="text-xs text-slate-400">Please review the details before atomic tenant provisioning.</p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-800/80 pb-2">
                      <div>
                        <span className="text-slate-500 block">Society Name:</span>
                        <span className="font-semibold text-white text-sm">{formData.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block">Tenant Code:</span>
                        <span className="font-mono font-bold text-blue-400">{formData.code}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-slate-800/80 pb-2 text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Society Type:</span>
                        <span>{formData.society_type}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Reg Number:</span>
                        <span>{formData.registration_number}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Plan:</span>
                        <span className="text-amber-400 font-medium">{formData.subscription_plan}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">District / State:</span>
                        <span>{formData.address_district}, {formData.address_state}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Bank:</span>
                        <span>{formData.bank_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">A/C No:</span>
                        <span className="font-mono">{formData.account_number || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px] mb-1">PKPS Administrator to be Provisioned:</span>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-100">{formData.admin_full_name} ({formData.admin_designation})</p>
                          <p className="text-slate-400 text-[11px]">{formData.admin_email} | {formData.admin_mobile}</p>
                        </div>
                        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                          PKPS_ADMIN
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {!successData && (
          <div className="px-6 py-4 border-t border-slate-800/80 flex justify-between items-center bg-slate-950/40">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium flex items-center space-x-1 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm transition"
              >
                Cancel
              </button>

              {step < 7 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center space-x-1 transition"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {loading ? (
                    <span>Provisioning PKPS Society...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirm & Provision Tenant</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
