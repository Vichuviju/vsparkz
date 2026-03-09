import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export function PlatformPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    price_monthly: '',
    price_yearly: '',
    max_clients: '',
    max_projects: '',
    max_users: '',
    is_active: true,
    sort_order: '',
  });

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchPlans = () => {
    setLoading(true);
    api
      .get('/admin/platform/plans')
      .then((r) => setPlans(Array.isArray(r.data) ? r.data : []))
      .catch(() => {
        setPlans([]);
        setError('Failed to load plans.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchPlans();
  }, [isSuperAdmin]);

  const openCreate = () => {
    setModal('create');
    setEditingPlan(null);
    setForm({
      name: '',
      slug: '',
      price_monthly: '',
      price_yearly: '',
      max_clients: '',
      max_projects: '',
      max_users: '',
      is_active: true,
      sort_order: '',
    });
    setError(null);
  };

  const openEdit = (p) => {
    setModal('edit');
    setEditingPlan(p);
    setForm({
      name: p.name ?? '',
      slug: p.slug ?? '',
      price_monthly: p.price_monthly ?? '',
      price_yearly: p.price_yearly ?? '',
      max_clients: p.max_clients ?? '',
      max_projects: p.max_projects ?? '',
      max_users: p.max_users ?? '',
      is_active: p.is_active !== false,
      sort_order: p.sort_order ?? '',
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingPlan(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      price_monthly: form.price_monthly ? Number(form.price_monthly) : null,
      price_yearly: form.price_yearly ? Number(form.price_yearly) : null,
      max_clients: form.max_clients ? Number(form.max_clients) : null,
      max_projects: form.max_projects ? Number(form.max_projects) : null,
      max_users: form.max_users ? Number(form.max_users) : null,
      is_active: form.is_active,
      sort_order: form.sort_order ? Number(form.sort_order) : null,
    };
    try {
      if (modal === 'create') {
        await api.post('/admin/platform/plans', payload);
      } else {
        await api.put(`/admin/platform/plans/${editingPlan.id}`, payload);
      }
      fetchPlans();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete plan "${p.name}"?`)) return;
    setError(null);
    try {
      await api.delete(`/admin/platform/plans/${p.id}`);
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete plan.');
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
        <h1 className="text-2xl font-bold text-text-primary">Subscription Plans</h1>
        <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
          + Create plan
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
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="dark:bg-navy-800/50 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-text-primary">Name</th>
                <th className="px-4 py-3 font-medium text-text-primary">Slug</th>
                <th className="px-4 py-3 font-medium text-text-primary">Price (mo/yr)</th>
                <th className="px-4 py-3 font-medium text-text-primary">Limits</th>
                <th className="px-4 py-3 font-medium text-text-primary">Active</th>
                <th className="px-4 py-3 font-medium text-text-primary w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    No plans yet. Create a plan first.
                  </td>
                </tr>
              ) : (
                plans.map((p) => (
                  <tr key={p.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{p.slug ?? '—'}</td>
                    <td className="px-4 py-3">
                      ₹{Number(p.price_monthly ?? 0).toLocaleString()}/mo
                      {p.price_yearly != null && ` · ₹${Number(p.price_yearly).toLocaleString()}/yr`}
                    </td>
                    <td className="px-4 py-3">
                      {[p.max_users != null && `Users: ${p.max_users}`, p.max_clients != null && `Clients: ${p.max_clients}`, p.max_projects != null && `Projects: ${p.max_projects}`]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3">{p.is_active !== false ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => openEdit(p)} className="text-accent hover:underline text-sm mr-2">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(p)} className="text-red-500 hover:underline text-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div
            className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {modal === 'create' ? 'Create plan' : 'Edit plan'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="Auto from name if empty"
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Price monthly</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price_monthly}
                    onChange={(e) => setForm((f) => ({ ...f, price_monthly: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Price yearly</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price_yearly}
                    onChange={(e) => setForm((f) => ({ ...f, price_yearly: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Max users</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_users}
                    onChange={(e) => setForm((f) => ({ ...f, max_users: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Max clients</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_clients}
                    onChange={(e) => setForm((f) => ({ ...f, max_clients: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Max projects</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_projects}
                    onChange={(e) => setForm((f) => ({ ...f, max_projects: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Sort order</label>
                <input
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              {modal === 'edit' && (
                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  Active
                </label>
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
