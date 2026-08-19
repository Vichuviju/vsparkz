import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = [
  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
];

const TEAM_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'agency_admin', label: 'Agency Admin' },
  { value: 'agency_staff', label: 'Agency Staff' },
];

const ROLE_STYLES = {
  super_admin: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
  agency_admin: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
  agency_staff: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border-slate-100 dark:border-slate-800',
};

export function Team() {
  const { user: currentUser } = useAuth();
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'agency_staff',
    agency_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [agencies, setAgencies] = useState([]);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const canManageTeam = isSuperAdmin || currentUser?.role === 'agency_admin';
  const roleOptions = isSuperAdmin
    ? TEAM_ROLES
    : TEAM_ROLES.filter((r) => r.value !== 'super_admin');

  const fetchList = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 10 };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    
    api.get('/admin/team', { params })
      .then(({ data }) => {
        const rawData = data.data ?? data;
        setList(Array.isArray(rawData) ? rawData : []);
        setMeta({
          current_page: data.current_page ?? 1,
          last_page: data.last_page ?? 1,
          total: data.total ?? rawData.length,
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      api.get('/admin/agencies').then(({ data }) => setAgencies((data.data ?? data) || [])).catch(() => setAgencies([]));
    }
  }, [isSuperAdmin]);

  const openCreate = () => {
    setModal('new');
    setForm({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'agency_staff',
      agency_id: isSuperAdmin && agencies.length ? String(agencies[0]?.id ?? '') : '',
    });
    setError(null);
  };

  const openEdit = (row) => {
    setModal(row.id);
    const effectiveRole = row.roles?.[0]?.slug ?? row.role ?? 'agency_staff';
    setForm({
      name: row.name ?? '',
      email: row.email ?? '',
      password: '',
      password_confirmation: '',
      role: effectiveRole,
      agency_id: row.agency_id ? String(row.agency_id) : '',
    });
    setError(null);
  };

  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      agency_id: form.agency_id ? (form.agency_id === '' ? null : Number(form.agency_id)) : null,
    };
    if (modal === 'new') {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    } else if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }
    
    try {
      if (modal === 'new') {
        await api.post('/admin/team', payload);
      } else {
        await api.put(`/admin/team/${modal}`, payload);
      }
      fetchList(meta.current_page);
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || err.response?.data?.errors?.role?.[0] || 'Failed to save';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this team member? They will no longer be able to sign in.')) return;
    setError(null);
    try {
      await api.delete(`/admin/team/${id}`);
      fetchList(meta.current_page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const roleLabel = (slug) => TEAM_ROLES.find((r) => r.value === slug)?.label ?? slug;

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Title area and CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Team Management</h1>
          <p className="mt-1 text-sm font-medium text-slate-400 dark:text-slate-500">
            Configure system permissions, roles, and agency access controls.
          </p>
        </div>
        <div>
          {canManageTeam && (
            <button 
              type="button" 
              onClick={openCreate} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/10 transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Member
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); fetchList(1); }}>
            <input 
              type="text" 
              placeholder="Search name or email..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-white placeholder-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/50"
            />
          </form>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select 
            value={roleFilter} 
            onChange={(e) => { setRoleFilter(e.target.value); setTimeout(() => fetchList(1), 0); }}
            className="px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="">All Roles</option>
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-semibold text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/30 border-t-blue-500 mx-auto mb-4" />
            Loading team database…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-left text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role Badge</th>
                  <th className="px-6 py-4">Agency</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-slate-400 text-center font-bold">No team members found</td>
                  </tr>
                ) : (
                  list.map((row, index) => {
                    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                    const initial = row.name ? row.name.slice(0, 2).toUpperCase() : 'US';
                    const effectiveRoleSlug = row.roles?.[0]?.slug ?? row.role ?? 'agency_staff';
                    
                    return (
                      <tr 
                        key={row.id} 
                        className="border-t border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        {/* Name and Circle Initials Avatar */}
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${avatarColor}`}>
                              {initial}
                            </div>
                            <div>
                              <div className="text-slate-800 dark:text-white text-xs font-extrabold">{row.name}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Workspace Member</div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">{row.email}</td>

                        {/* Role pill badge */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                            ROLE_STYLES[effectiveRoleSlug] || ROLE_STYLES.agency_staff
                          }`}>
                            {roleLabel(effectiveRoleSlug)}
                          </span>
                        </td>

                        {/* Agency name */}
                        <td className="px-6 py-4 text-slate-800 dark:text-white font-bold">
                          {row.agency?.name ?? 'Super Administrator'}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            {(canManageTeam || row.id === currentUser?.id) && (
                              <button 
                                type="button" 
                                onClick={() => openEdit(row)} 
                                className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                                title="Edit Profile Details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                            )}

                            {canManageTeam && (
                              <button 
                                type="button" 
                                onClick={() => handleDelete(row.id)} 
                                disabled={row.id === currentUser?.id}
                                className="text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
                                title={row.id === currentUser?.id ? 'Cannot delete yourself' : 'Remove Access'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && meta.last_page > 1 && (
          <div className="px-6 py-4.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900/60">
            <span>
              Showing {((meta.current_page - 1) * 10) + 1} to {Math.min(meta.current_page * 10, meta.total)} of {meta.total} results
            </span>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                disabled={meta.current_page <= 1} 
                onClick={() => fetchList(meta.current_page - 1)} 
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => fetchList(pageNum)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${
                    meta.current_page === pageNum
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button 
                type="button" 
                disabled={meta.current_page >= meta.last_page} 
                onClick={() => fetchList(meta.current_page + 1)} 
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[10px]">10 / page</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Team Modal Overlay Form */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto z-[9999] bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full p-6 my-8 border border-slate-100 dark:border-slate-800 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-4">
              {modal === 'new' ? 'Add Team Member' : 'Edit Team Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {isSuperAdmin && form.role !== 'super_admin' && (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Agency Assignee</label>
                    <select
                      value={form.agency_id}
                      onChange={(e) => setForm((f) => ({ ...f, agency_id: e.target.value }))}
                      className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="">— Select agency —</option>
                      {agencies.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                    {modal === 'new' ? 'Password *' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required={modal === 'new'}
                    placeholder={modal === 'new' ? '' : '••••••••'}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={form.password_confirmation}
                    onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                    required={modal === 'new'}
                    placeholder={modal === 'new' ? '' : '••••••••'}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
