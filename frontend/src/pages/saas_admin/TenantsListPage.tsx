import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Building2, Plus, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const TenantsListPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    registration_number: '',
    village: '',
    taluk: '',
    district: '',
    state: 'Karnataka',
    pincode: '',
    dccb_name: '',
    contact_number: '',
    email: '',
    subscription_plan: 'STANDARD'
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants/');
      setTenants(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tenants/', formData);
      setShowModal(false);
      fetchTenants();
      setFormData({
        code: '', name: '', registration_number: '', village: '', taluk: '', district: '',
        state: 'Karnataka', pincode: '', dccb_name: '', contact_number: '', email: '', subscription_plan: 'STANDARD'
      });
    } catch (err) {
      alert('Error creating tenant');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.post(`/tenants/${id}/update-status/`, { status });
      fetchTenants();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">PKPS Tenant Organizations</h1>
          <p className="text-slate-400 text-sm">Register and approve PACS societies across districts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center space-x-2 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Register New PKPS</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4">Tenant Code</th>
              <th className="p-4">PKPS Name</th>
              <th className="p-4">Reg No</th>
              <th className="p-4">District</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/50">
                <td className="p-4 font-mono text-xs text-blue-400">{t.code}</td>
                <td className="p-4 font-semibold text-slate-100">{t.name}</td>
                <td className="p-4 text-slate-400">{t.registration_number}</td>
                <td className="p-4">{t.district}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {t.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'ACTIVE')}
                      className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-medium"
                    >
                      Approve & Activate
                    </button>
                  )}
                  {t.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'SUSPENDED')}
                      className="px-3 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 text-xs font-medium"
                    >
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Register New PKPS Society</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Tenant Code (e.g. PKPS-MANDYA-002)"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                />
                <input
                  type="text"
                  placeholder="PKPS Society Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                />
                <input
                  type="text"
                  placeholder="Registration Number"
                  required
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                />
                <input
                  type="text"
                  placeholder="District"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                />
                <input
                  type="text"
                  placeholder="DCCB Bank Name"
                  value={formData.dccb_name}
                  onChange={(e) => setFormData({ ...formData, dccb_name: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm"
                >
                  Create & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
