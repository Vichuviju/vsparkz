import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function PlatformTenants() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    name: '',
    slug: '',
    email: '',
    phone: '',
    plan_id: '',
    trial_ends_at: '',
    subscription_ends_at: '',
    create_login: true,
    send_invite_email: true,
  });

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchTenants = (page = 1) => {
    setLoading(true);
    api
      .get('/admin/platform/tenants', { params: { page, per_page: 15 } })
      .then((r) => {
        const d = r.data;
        const list = d?.data ?? d ?? [];
        setTenants(Array.isArray(list) ? list : []);
        setMeta({
          current_page: d?.current_page ?? 1,
          last_page: d?.last_page ?? 1,
          total: d?.total ?? 0,
        });
      })
      .catch(() => {
        setTenants([]);
        setError('Failed to load tenants.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchTenants();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    api.get('/admin/platform/plans').then((r) => setPlans(Array.isArray(r.data) ? r.data : [])).catch(() => setPlans([]));
  }, [isSuperAdmin]);

  const openCreate = () => {
    setModal('create');
    setEditingTenant(null);
    setForm({
      company_name: '',
      name: '',
      slug: '',
      email: '',
      phone: '',
      plan_id: plans[0]?.id ?? '',
      trial_ends_at: '',
      subscription_ends_at: '',
      create_login: true,
      send_invite_email: true,
    });
    setError(null);
  };

  const openEdit = (t) => {
    setModal('edit');
    setEditingTenant(t);
    setForm({
      company_name: t.company_name ?? '',
      name: t.name ?? '',
      slug: t.slug ?? '',
      email: t.email ?? '',
      phone: t.phone ?? '',
      plan_id: t.plan_id ?? '',
      status: t.status ?? 'active',
      trial_ends_at: t.trial_ends_at ? t.trial_ends_at.slice(0, 10) : '',
      subscription_ends_at: t.subscription_ends_at ? t.subscription_ends_at.slice(0, 10) : '',
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingTenant(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      company_name: form.company_name,
      name: form.name || form.company_name,
      slug: form.slug,
      email: form.email,
      phone: form.phone || null,
      plan_id: form.plan_id ? Number(form.plan_id) : null,
      trial_ends_at: form.trial_ends_at || null,
      subscription_ends_at: form.subscription_ends_at || null,
    };
    if (modal === 'create') {
      payload.create_login = form.create_login;
      payload.send_invite_email = form.send_invite_email;
    }
    try {
      if (modal === 'create') {
        await api.post('/admin/platform/tenants', payload);
      } else {
        await api.put(`/admin/platform/tenants/${editingTenant.id}`, payload);
      }
      fetchTenants(meta.current_page);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.message || 'Failed to save tenant.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete tenant "${t.company_name ?? t.name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await api.delete(`/admin/platform/tenants/${t.id}`);
      fetchTenants(meta.current_page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete tenant.');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200">
        Access restricted. Super admin only.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Tenants</h1>
        <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
          + Create tenant
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-text-muted">Loading…</p>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="dark:bg-navy-800/50 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-text-primary">Name</th>
                  <th className="px-4 py-3 font-medium text-text-primary">Slug</th>
                  <th className="px-4 py-3 font-medium text-text-primary">Email</th>
                  <th className="px-4 py-3 font-medium text-text-primary">Plan</th>
                  <th className="px-4 py-3 font-medium text-text-primary">Status</th>
                  <th className="px-4 py-3 font-medium text-text-primary w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-navy-700">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                      No tenants yet. Create a tenant to get started.
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr key={t.id} className="dark:hover:bg-navy-800/50">
                      <td className="px-4 py-3 font-medium">{t.company_name ?? t.name}</td>
                      <td className="px-4 py-3">{t.slug}</td>
                      <td className="px-4 py-3">{t.email ?? '—'}</td>
                      <td className="px-4 py-3">{t.plan?.name ?? '—'}</td>
                      <td className="px-4 py-3">{t.status}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => openEdit(t)} className="text-accent hover:underline text-sm mr-2">
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(t)} className="text-red-500 hover:underline text-sm">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta.last_page > 1 && (
            <div className="mt-4 flex gap-2 items-center">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => fetchTenants(meta.current_page - 1)}
                className="px-3 py-1 border dark:border-navy-600 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-text-muted">
                Page {meta.current_page} of {meta.last_page} ({meta.total} total)
              </span>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => fetchTenants(meta.current_page + 1)}
                className="px-3 py-1 border dark:border-navy-600 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div
            className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {modal === 'create' ? 'Create tenant' : 'Edit tenant'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Company name *</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Display name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Same as company if empty"
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                  placeholder="e.g. acme-corp"
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Plan</label>
                <select
                  value={form.plan_id}
                  onChange={(e) => setForm((f) => ({ ...f, plan_id: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                >
                  <option value="">— None —</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Trial ends</label>
                  <input
                    type="date"
                    value={form.trial_ends_at}
                    onChange={(e) => setForm((f) => ({ ...f, trial_ends_at: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Subscription ends</label>
                  <input
                    type="date"
                    value={form.subscription_ends_at}
                    onChange={(e) => setForm((f) => ({ ...f, subscription_ends_at: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  />
                </div>
              </div>
              {modal === 'create' && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={form.create_login}
                      onChange={(e) => setForm((f) => ({ ...f, create_login: e.target.checked }))}
                    />
                    Create admin login
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={form.send_invite_email}
                      onChange={(e) => setForm((f) => ({ ...f, send_invite_email: e.target.checked }))}
                    />
                    Send invite email
                  </label>
                </div>
              )}
              {modal === 'edit' && form.status !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={closeModal} className="px-4 py-2 border dark:border-navy-600 rounded text-sm">
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
