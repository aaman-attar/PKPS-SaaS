import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { UserPlus, Search, MapPin, Layers, FileText } from 'lucide-react';

export const MembersListPage: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showLandModal, setShowLandModal] = useState<any>(null);

  const [formData, setFormData] = useState({
    member_number: '',
    first_name: '',
    last_name: '',
    gender: 'MALE',
    mobile: '',
    email: '',
    address: '',
    village: '',
    taluk: '',
    district: '',
    pincode: '',
  });

  const [landData, setLandData] = useState({
    survey_number: '',
    area_acres: '2.50',
    unit: 'Acres',
    village: '',
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
      setShowModal(false);
      fetchMembers();
      setFormData({
        member_number: '', first_name: '', last_name: '', gender: 'MALE',
        mobile: '', email: '', address: '', village: '', taluk: '', district: '', pincode: '',
      });
    } catch (err) {
      alert('Error enrolling member');
    }
  };

  const handleAddLand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLandModal) return;
    try {
      await api.post(`/members/${showLandModal.id}/add-land/`, landData);
      setShowLandModal(null);
      fetchMembers();
    } catch (err) {
      alert('Error adding land record');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Society Member Registry</h1>
          <p className="text-slate-400 text-sm">Enroll farmers, register land holdings, and KYC profiles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center space-x-2 transition shadow-lg shadow-emerald-600/20"
        >
          <UserPlus className="w-5 h-5" />
          <span>Enroll New Member</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3" />
        <input
          type="text"
          placeholder="Search by Name, Member ID, or Mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Members Grid/Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4">Member ID</th>
              <th className="p-4">Full Name</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">Village</th>
              <th className="p-4">Registered Land</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/50">
                <td className="p-4 font-mono text-xs text-emerald-400 font-semibold">{m.member_number}</td>
                <td className="p-4 font-semibold text-slate-100">{m.first_name} {m.last_name}</td>
                <td className="p-4 font-mono">{m.mobile}</td>
                <td className="p-4">{m.village}</td>
                <td className="p-4">
                  {m.lands && m.lands.length > 0 ? (
                    <span className="text-xs text-emerald-300 font-medium">
                      {m.lands.reduce((acc: number, l: any) => acc + parseFloat(l.area_acres), 0)} Acres
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">No Land Registered</span>
                  )}
                </td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {m.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => {
                      setShowLandModal(m);
                      setLandData({ ...landData, village: m.village });
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium"
                  >
                    + Add Land
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enroll Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Enroll Farmer Member</h3>
            <form onSubmit={handleEnrollMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Member ID (e.g. M-000126)"
                  required
                  value={formData.member_number}
                  onChange={(e) => setFormData({ ...formData, member_number: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                />
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                />
                <input
                  type="text"
                  placeholder="Mobile Number"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                />
                <input
                  type="text"
                  placeholder="Village"
                  required
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                />
                <input
                  type="text"
                  placeholder="Taluk"
                  value={formData.taluk}
                  onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm"
                >
                  Enroll & Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Land Modal */}
      {showLandModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Register Land for {showLandModal.first_name}</h3>
            <form onSubmit={handleAddLand} className="space-y-4">
              <input
                type="text"
                placeholder="Survey Number (e.g. SY-145/2B)"
                required
                value={landData.survey_number}
                onChange={(e) => setLandData({ ...landData, survey_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Area in Acres (e.g. 3.50)"
                required
                value={landData.area_acres}
                onChange={(e) => setLandData({ ...landData, area_acres: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
              />
              <input
                type="text"
                placeholder="Village"
                required
                value={landData.village}
                onChange={(e) => setLandData({ ...landData, village: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
              />

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLandModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm"
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
