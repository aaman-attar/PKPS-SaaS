import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, Plus, ShieldCheck, UserCheck, Search, Filter, Mail, Phone, Building2 } from 'lucide-react';

export const UsersListPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'PKPS_ADMIN',
    password: '',
    mobile: '9845403249',
    tenant_id: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchTenants();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users/');
      setUsers(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants/');
      setTenants(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        password: formData.password,
        mobile: formData.mobile,
      };

      if (formData.tenant_id) {
        payload.tenant_id = formData.tenant_id;
      }

      await api.post('/auth/users/', payload);
      setShowModal(false);
      fetchUsers();
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'PKPS_ADMIN',
        password: '',
        mobile: '9845403249',
        tenant_id: ''
      });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.username?.[0] || 'Error creating user.';
      alert(msg);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.first_name + ' ' + u.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.mobile || '').includes(searchTerm);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-blue-600/20 text-blue-400 border border-blue-500/30';
      case 'PKPS_ADMIN':
        return 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30';
      case 'FARMER':
        return 'bg-amber-600/20 text-amber-400 border border-amber-500/30';
      case 'LOAN_OFFICER':
        return 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30';
      case 'SECRETARY':
      case 'MANAGER':
        return 'bg-purple-600/20 text-purple-400 border border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Platform Users & Access Management</h1>
          <p className="text-slate-400 text-sm">Manage Super Admins, PKPS Society Administrators, Staff & Farmers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center space-x-2 transition shadow-lg shadow-blue-600/20 shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Platform User</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search by username, name, email or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="relative">
          <Filter className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition appearance-none cursor-pointer"
          >
            <option value="ALL">All Platform Roles</option>
            <option value="SUPER_ADMIN">SUPER ADMIN</option>
            <option value="PKPS_ADMIN">PKPS ADMIN</option>
            <option value="LOAN_OFFICER">LOAN OFFICER</option>
            <option value="FARMER">FARMER</option>
            <option value="SECRETARY">SECRETARY</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ACCOUNTANT">ACCOUNTANT</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading platform users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No platform users found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Assigned Tenant / Society</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">2FA Status</th>
                  <th className="p-4 text-right">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-4">
                      <div className="font-semibold text-slate-100">{u.first_name || u.username} {u.last_name}</div>
                      <div className="text-xs font-mono text-slate-400">@{u.username}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.tenant_name || u.tenant?.name ? (
                        <div className="flex items-center space-x-2 text-slate-200">
                          <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{u.tenant_name || u.tenant?.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-blue-400 font-mono">GLOBAL / SAAS PLATFORM</span>
                      )}
                    </td>
                    <td className="p-4 space-y-0.5 text-xs text-slate-400">
                      {u.email && (
                        <div className="flex items-center space-x-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{u.email}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1.5 font-mono text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{u.mobile || '+919845403249'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center space-x-1 w-fit">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>2FA Active</span>
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-xs text-slate-500">
                      {String(u.id).substring(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Platform User */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <UserCheck className="w-6 h-6 text-blue-400" />
                <span>Create New Platform User</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. secretary_mandya"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Set secure password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number (SMS OTP)</label>
                  <input
                    type="text"
                    placeholder="e.g. 9845403249"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="email@domain.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Platform Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN (SaaS Platform)</option>
                    <option value="PKPS_ADMIN">PKPS ADMIN (Society)</option>
                    <option value="LOAN_OFFICER">LOAN OFFICER</option>
                    <option value="SECRETARY">SECRETARY</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="AUDITOR">AUDITOR</option>
                    <option value="FARMER">FARMER (Self Service)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Assign PKPS Tenant</label>
                  <select
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Global SaaS / No Tenant</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20"
                >
                  Create Platform User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
