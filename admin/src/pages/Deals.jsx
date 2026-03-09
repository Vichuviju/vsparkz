import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function Deals() {
  const [deals, setDeals] = useState([]);
  const [stages, setStages] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    client_id: '',
    lead_id: '',
    amount: '',
    currency: 'INR',
    expected_close_date: '',
    current_stage_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchDeals = () => {
    setLoading(true);
    api.get('/admin/deals')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setDeals(Array.isArray(d) ? d : []);
      })
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeals();
    api.get('/admin/deal-stages').then((r) => setStages(r.data?.data ?? [])).catch(() => setStages([]));
    api.get('/admin/clients', { params: { per_page: 500 } }).then((r) => {
      const res = r.data;
      const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
      setClients(list);
    }).catch(() => setClients([]));
  }, []);

  const openCreate = () => {
    setModal('new');
    setForm({
      name: '',
      client_id: '',
      lead_id: '',
      amount: '',
      currency: 'INR',
      expected_close_date: '',
      current_stage_id: stages.find((s) => s.is_default)?.id || stages[0]?.id || '',
    });
    setError(null);
  };

  const openEdit = (deal) => {
    setModal(deal.id);
    setForm({
      name: deal.name ?? '',
      client_id: deal.client_id ?? '',
      lead_id: deal.lead_id ?? '',
      amount: deal.amount ?? '',
      currency: deal.currency ?? 'INR',
      expected_close_date: deal.expected_close_date ? deal.expected_close_date.slice(0, 10) : '',
      current_stage_id: deal.current_stage_id ?? '',
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
      client_id: form.client_id || null,
      lead_id: form.lead_id || null,
      amount: form.amount ? Number(form.amount) : null,
      currency: form.currency || null,
      expected_close_date: form.expected_close_date || null,
      current_stage_id: form.current_stage_id || null,
    };
    try {
      if (modal === 'new') {
        await api.post('/admin/deals', payload);
      } else {
        await api.put(`/admin/deals/${modal}`, payload);
      }
      fetchDeals();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this deal?')) return;
    try {
      await api.delete(`/admin/deals/${id}`);
      fetchDeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const updateStage = async (dealId, stageId) => {
    try {
      await api.put(`/admin/deals/${dealId}`, { current_stage_id: stageId });
      fetchDeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stage');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-text-primary">Deals</h1>
        <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
          + Add deal
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="dark:bg-navy-800/50 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Client</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Stage</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {deals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    No deals yet. Add a deal to get started.
                  </td>
                </tr>
              ) : (
                deals.map((d) => (
                  <tr key={d.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3">{d.client?.company_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {d.currency} {d.amount != null ? Number(d.amount).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={d.current_stage_id ?? ''}
                        onChange={(e) => updateStage(d.id, e.target.value || null)}
                        className="px-2 py-1 text-sm border dark:border-navy-600 dark:bg-navy-800 rounded dark:text-text-primary"
                      >
                        <option value="">—</option>
                        {stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        className="text-accent hover:underline text-sm mr-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d.id)}
                        className="text-red-500 hover:underline text-sm"
                      >
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
            className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {modal === 'new' ? 'Add deal' : 'Edit deal'}
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
                <label className="block text-sm font-medium text-text-primary mb-1">Client</label>
                <select
                  value={form.client_id}
                  onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                >
                  <option value="">— None —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Currency</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                    placeholder="INR"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Stage</label>
                <select
                  value={form.current_stage_id}
                  onChange={(e) => setForm((f) => ({ ...f, current_stage_id: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                >
                  <option value="">—</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Expected close date</label>
                <input
                  type="date"
                  value={form.expected_close_date}
                  onChange={(e) => setForm((f) => ({ ...f, expected_close_date: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">
                  {saving ? 'Saving...' : 'Save'}
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

export default Deals;
export { Deals };
