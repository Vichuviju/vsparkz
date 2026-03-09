import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export function PlatformSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenant_id: '',
    plan_id: '',
    billing_cycle: 'monthly',
    started_at: '',
    expires_at: '',
    trial_ends_at: '',
  });

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchSubscriptions = (page = 1) => {
    setLoading(true);
    api
      .get('/admin/platform/subscriptions', { params: { page, per_page: 15 } })
      .then((r) => {
        const d = r.data;
        const list = d?.data ?? d ?? [];
        setSubscriptions(Array.isArray(list) ? list : []);
        setMeta({
          current_page: d?.current_page ?? 1,
          last_page: d?.last_page ?? 1,
          total: d?.total ?? 0,
        });
      })
      .catch(() => {
        setSubscriptions([]);
        setError('Failed to load subscriptions.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchSubscriptions();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    Promise.all([
      api.get('/admin/platform/tenants', { params: { per_page: 500 } }),
      api.get('/admin/platform/plans'),
    ]).then(([tenantsRes, plansRes]) => {
      const tData = tenantsRes.data;
      setTenants(Array.isArray(tData?.data) ? tData.data : (Array.isArray(tData) ? tData : []));
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
    }).catch(() => {
      setTenants([]);
      setPlans([]);
    });
  }, [isSuperAdmin]);

  const openCreate = () => {
    setModal('create');
    setEditingSub(null);
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      tenant_id: tenants[0]?.id ?? '',
      plan_id: plans[0]?.id ?? '',
      billing_cycle: 'monthly',
      started_at: today,
      expires_at: '',
      trial_ends_at: '',
    });
    setError(null);
  };

  const openEdit = (s) => {
    setModal('edit');
    setEditingSub(s);
    setForm({
      expires_at: s.expires_at ? s.expires_at.slice(0, 10) : '',
      status: s.status ?? 'active',
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingSub(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (modal === 'create') {
        const payload = {
          tenant_id: Number(form.tenant_id),
          plan_id: Number(form.plan_id),
          billing_cycle: form.billing_cycle,
          started_at: form.started_at || null,
          expires_at: form.expires_at || null,
          trial_ends_at: form.trial_ends_at || null,
        };
        await api.post('/admin/platform/subscriptions', payload);
      } else {
        await api.put(`/admin/platform/subscriptions/${editingSub.id}`, {
          expires_at: form.expires_at || null,
          status: form.status,
        });
      }
      fetchSubscriptions(meta.current_page);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save subscription.');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200">
        Access restricted. Super admin only.
      </div>
    );
  }

  const list = Array.isArray(subscriptions) ? subscriptions : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Subscriptions</h1>
        <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
          + Create subscription
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
                  <th className="px-4 py-3 font-medium text-text-primary">Tenant</th>
                  <th className="px-4 py-3 font-medium text-text-primary">Plan</th>
                  <th className="px-4 py-3 font-medium text-text-primary">Cycle</th>
                  <th className="px-4 py-3 font-medium text-text-primary">Status</th>
                  <th className="px-4 py-3 font-medium text-text-primary">Started</th>
                  <th className="px-4 py-3 font-medium text-text-primary">Expires</th>
                  <th className="px-4 py-3 font-medium text-text-primary w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-navy-700">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                      No subscriptions yet. Create one to assign a plan to a tenant.
                    </td>
                  </tr>
                ) : (
                  list.map((s) => (
                    <tr key={s.id} className="dark:hover:bg-navy-800/50">
                      <td className="px-4 py-3 font-medium">{s.tenant?.name ?? s.tenant?.company_name ?? s.tenant_id}</td>
                      <td className="px-4 py-3">{s.plan?.name ?? '—'}</td>
                      <td className="px-4 py-3">{s.billing_cycle}</td>
                      <td className="px-4 py-3">{s.status}</td>
                      <td className="px-4 py-3">{s.started_at ? new Date(s.started_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => openEdit(s)} className="text-accent hover:underline text-sm">
                          Edit
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
                onClick={() => fetchSubscriptions(meta.current_page - 1)}
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
                onClick={() => fetchSubscriptions(meta.current_page + 1)}
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
            className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {modal === 'create' ? 'Create subscription' : 'Edit subscription'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {modal === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Tenant *</label>
                    <select
                      value={form.tenant_id}
                      onChange={(e) => setForm((f) => ({ ...f, tenant_id: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                    >
                      <option value="">— Select —</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.company_name ?? t.name} ({t.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Plan *</label>
                    <select
                      value={form.plan_id}
                      onChange={(e) => setForm((f) => ({ ...f, plan_id: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                    >
                      <option value="">— Select —</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Billing cycle *</label>
                    <select
                      value={form.billing_cycle}
                      onChange={(e) => setForm((f) => ({ ...f, billing_cycle: e.target.value }))}
                      className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Started at</label>
                    <input
                      type="date"
                      value={form.started_at}
                      onChange={(e) => setForm((f) => ({ ...f, started_at: e.target.value }))}
                      className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Expires at</label>
                    <input
                      type="date"
                      value={form.expires_at}
                      onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                      className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Trial ends at</label>
                    <input
                      type="date"
                      value={form.trial_ends_at}
                      onChange={(e) => setForm((f) => ({ ...f, trial_ends_at: e.target.value }))}
                      className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                    />
                  </div>
                </>
              )}
              {modal === 'edit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Expires at</label>
                    <input
                      type="date"
                      value={form.expires_at}
                      onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                      className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                    >
                      <option value="active">Active</option>
                      <option value="overdue">Overdue</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </>
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
