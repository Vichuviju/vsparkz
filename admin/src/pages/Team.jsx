import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TEAM_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'agency_admin', label: 'Agency Admin' },
  { value: 'agency_staff', label: 'Agency Staff' },
];

export function Team() {
  const { user: currentUser } = useAuth();
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState({});
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
    const params = { page, per_page: 15 };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    api
      .get('/admin/team', { params })
      .then(({ data }) => {
        setList(data.data ?? data);
        setMeta({
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
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
      fetchList();
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
      fetchList();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const roleLabel = (slug) => TEAM_ROLES.find((r) => r.value === slug)?.label ?? slug;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Team</h1>
        {canManageTeam && (
          <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
            + Add member
          </button>
        )}
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 dark:text-accent-bright text-cyan-800 text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-4 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchList(1);
          }}
          className="flex flex-wrap gap-2 flex-1 min-w-[200px]"
        >
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 placeholder-gray-400 text-sm focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
            }}
            className="px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 text-sm"
          >
            <option value="">All roles</option>
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary px-4 py-2 text-sm">
            Search
          </button>
        </form>
      </div>
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center dark:text-text-muted text-gray-500">
            Loading…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="dark:bg-navy-800/50 bg-gray-50 text-left">
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Name</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Email</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Role</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Agency</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 dark:text-text-muted text-gray-500 text-center">
                      No team members yet
                    </td>
                  </tr>
                ) : (
                  list.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t dark:border-navy-600 border-gray-200 dark:hover:bg-navy-700/30 hover:bg-gray-50"
                    >
                      <td className="px-5 py-3 dark:text-text-primary text-gray-900 font-medium">
                        {row.name}
                      </td>
                      <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.email}</td>
                      <td className="px-5 py-3 dark:text-text-muted text-gray-500">
                        {roleLabel(row.roles?.[0]?.slug ?? row.role)}
                      </td>
                      <td className="px-5 py-3 dark:text-text-muted text-gray-500">
                        {row.agency?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        {(canManageTeam || row.id === currentUser?.id) && (
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="text-accent hover:dark:text-accent-bright text-cyan-800 font-medium mr-2"
                          >
                            Edit
                          </button>
                        )}
                        {canManageTeam && (
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            disabled={row.id === currentUser?.id}
                            className="text-accent-muted hover:dark:text-accent-bright text-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={row.id === currentUser?.id ? 'You cannot delete your own account' : 'Remove'}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {meta.last_page > 1 && (
          <div className="px-5 py-3 border-t dark:border-navy-600 border-gray-200 flex justify-between items-center text-sm dark:text-text-muted text-gray-500">
            <span>
              Page {meta.current_page} of {meta.last_page} ({meta.total} total)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => fetchList(meta.current_page - 1)}
                className="px-3 py-1 rounded-vsparkz border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => fetchList(meta.current_page + 1)}
                className="px-3 py-1 rounded-vsparkz border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-card max-w-lg w-full p-6 my-8 border dark:border-navy-600 border-gray-200">
            <h2 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">
              {modal === 'new' ? 'Add team member' : 'Edit team member'}
            </h2>
            {error && (
              <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">
                  Role *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent"
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {isSuperAdmin && form.role !== 'super_admin' && (
                <div>
                  <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">
                    Agency
                  </label>
                  <select
                    value={form.agency_id}
                    onChange={(e) => setForm((f) => ({ ...f, agency_id: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent"
                  >
                    <option value="">— Select agency —</option>
                    {agencies.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">
                  {modal === 'new' ? 'Password *' : 'New password (leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={modal === 'new'}
                  autoComplete={modal === 'new' ? 'new-password' : 'new-password'}
                  placeholder={modal === 'new' ? '' : '••••••••'}
                  className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">
                  {modal === 'new' ? 'Confirm password *' : 'Confirm new password'}
                </label>
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                  required={modal === 'new'}
                  autoComplete="new-password"
                  placeholder={modal === 'new' ? '' : '••••••••'}
                  className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900 hover:bg-navy-700/80"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
